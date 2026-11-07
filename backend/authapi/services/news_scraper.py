import html
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
import re
from threading import Lock
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

import requests


GOOGLE_NEWS_RSS_URL = (
    'https://news.google.com/rss/search?q="mango"+OR+"carabao+mango"'
    '+Philippines+agriculture&hl=en-PH&gl=PH&ceid=PH:en'
)
FEED_URLS = (GOOGLE_NEWS_RSS_URL,)
FALLBACK_IMAGE_URL = (
    'https://images.unsplash.com/photo-1553279768-865429fa0078'
    '?auto=format&fit=crop&w=1200&q=85'
)
CACHE_TTL = timedelta(minutes=30)
MAX_ARTICLES = 6
MANGO_KEYWORDS = (
    'mango',
    'carabao mango',
    'mangga',
)

_CACHE_LOCK = Lock()
_MEMORY_ARTICLES = []
_MEMORY_REFRESHED_AT = None


class _ArticleDescriptionParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text_parts = []
        self.image_url = None

    def handle_data(self, data):
        text = data.strip()
        if text:
            self.text_parts.append(text)

    def handle_starttag(self, tag, attrs):
        if tag.lower() != 'img' or self.image_url:
            return
        image = dict(attrs).get('src')
        if _is_http_url(image):
            self.image_url = image


def _is_http_url(value):
    if not isinstance(value, str):
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme in ('http', 'https') and bool(parsed.netloc)


def _is_https_url(value):
    if not isinstance(value, str):
        return False
    normalized = value.strip()
    parsed = urlparse(normalized)
    return normalized.startswith('https://') and parsed.scheme == 'https' and bool(parsed.netloc)


def is_valid_mango_article(article):
    if not isinstance(article, dict) or not _is_https_url(article.get('source_url')):
        return False

    parsed_url = urlparse(article['source_url'].strip())
    is_article_path = parsed_url.path.strip('/') != ''
    is_google_news_article = (
        parsed_url.netloc.casefold() == 'news.google.com'
        and parsed_url.path.startswith('/rss/articles/')
    )
    searchable = ' '.join(
        str(article.get(field) or '')
        for field in ('title', 'description')
    ).casefold()
    contains_mango_keyword = any(keyword in searchable for keyword in MANGO_KEYWORDS)
    return (is_article_path or is_google_news_article) and contains_mango_keyword


def _clean_description(value):
    parser = _ArticleDescriptionParser()
    try:
        parser.feed(value or '')
        parser.close()
    except Exception:
        parser.text_parts = [re.sub(r'<[^>]+>', ' ', value or '')]
    return ' '.join(html.unescape(part) for part in parser.text_parts).strip(), parser.image_url


def _category(text):
    normalized = text.casefold()
    if any(word in normalized for word in ('anthracnose', 'stem-end rot', 'pest', 'disease')):
        return 'Pest & Disease'
    if any(word in normalized for word in ('export', 'standard', 'grading', 'quality')):
        return 'Standards & Export'
    if any(word in normalized for word in ('price', 'market', 'farmgate', 'production')):
        return 'Markets'
    if any(word in normalized for word in ('research', 'study', 'innovation', 'ai-powered')):
        return 'Research'
    return 'Cultivation'


def _parse_published_date(value):
    if not value:
        return None
    try:
        published = parsedate_to_datetime(value)
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        return published.astimezone(timezone.utc)
    except (TypeError, ValueError, OverflowError):
        return None


def _normalize_datetime(value):
    if not isinstance(value, datetime):
        return value
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _rss_articles(feed_url):
    response = requests.get(
        feed_url,
        headers={'User-Agent': 'ManGO-Agriculture-News/1.0'},
        timeout=(2, 3),
    )
    response.raise_for_status()
    root = ET.fromstring(response.content)
    articles = []

    for item in root.findall('.//item'):
        title = (item.findtext('title') or '').strip()
        link = (item.findtext('link') or '').strip()
        description_html = item.findtext('description') or ''
        description, image_url = _clean_description(description_html)
        source_element = item.find('source')
        source = (source_element.text or '').strip() if source_element is not None else ''
        if source and title.endswith(f' - {source}'):
            title = title[:-(len(source) + 3)].strip()

        article = {
            'title': title,
            'description': description or title,
            'source_url': link,
            'image_url': image_url or FALLBACK_IMAGE_URL,
            'published_date': _parse_published_date(item.findtext('pubDate')),
            'category': _category(f'{title} {description}'.casefold()),
            'source': source or urlparse(link).netloc,
        }
        if not title or not is_valid_mango_article(article):
            continue

        media_image = next(
            (
                element.attrib.get('url')
                for element in item.iter()
                if element.tag.rsplit('}', 1)[-1] in ('content', 'thumbnail')
                and _is_http_url(element.attrib.get('url'))
            ),
            None,
        )
        enclosure = item.find('enclosure')
        enclosure_url = enclosure.attrib.get('url') if enclosure is not None else None
        article['image_url'] = image_url or media_image or (
            enclosure_url if _is_http_url(enclosure_url) else None
        ) or FALLBACK_IMAGE_URL
        articles.append(article)

    return articles


def _fallback_articles(now):
    return [
        {
            'title': 'Enhancing the Philippine Mango Industry through S&T Interventions',
            'description': (
                'DOST-PCAARRD highlights science and technology interventions '
                'to strengthen the Philippine mango industry.'
            ),
            'source_url': 'https://www.pcaarrd.dost.gov.ph/index.php/quick-information-dispatch/3313-enhancing-the-philippine-mango-industry-through-s-t-interventions',
            'image_url': FALLBACK_IMAGE_URL,
            'published_date': None,
            'category': 'Research',
            'source': 'DOST-PCAARRD',
            'fetched_at': now,
        },
        {
            'title': 'Philippine National Standard for Fresh Mangoes (PNS/BAFS 07:2021)',
            'description': (
                'DA-BAFS grading and quality specifications for fresh mangoes.'
            ),
            'source_url': 'https://bafs.da.gov.ph/bafs_admin/admin_page/pns_file/PNS%20BAFS%2007-2021%20-%20Fresh%20Mangoes%20-%20Grading%20and%20Quality%20Specifications.pdf',
            'image_url': FALLBACK_IMAGE_URL,
            'published_date': None,
            'category': 'Standards & Export',
            'source': 'DA-BAFS',
            'fetched_at': now,
        },
        {
            'title': 'DA initiatives to revive and boost Philippine mango exports',
            'description': (
                'Department of Agriculture initiatives to strengthen mango '
                'production and exports in the Philippines.'
            ),
            'source_url': 'https://www.da.gov.ph/da-leads-initiatives-to-boost-mango-industry/',
            'image_url': FALLBACK_IMAGE_URL,
            'published_date': None,
            'category': 'Markets',
            'source': 'Department of Agriculture',
            'fetched_at': now,
        },
    ]


def _serialize_article(article):
    serialized = {
        key: article.get(key)
        for key in (
            'title',
            'description',
            'source_url',
            'image_url',
            'published_date',
            'category',
            'source',
        )
    }
    published = serialized['published_date']
    if isinstance(published, datetime):
        serialized['published_date'] = published.astimezone(timezone.utc).isoformat()
    return serialized


def _sort_articles(articles):
    return sorted(
        articles,
        key=lambda article: _normalize_datetime(article.get('published_date'))
        or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )


def _read_cache(collection):
    if collection is None:
        return [], None
    documents = [
        document
        for document in collection.find({}, {'_id': 0})
        .sort('published_date', -1)
        .limit(MAX_ARTICLES)
        if is_valid_mango_article(document)
    ]
    refreshed = max(
        (
            _normalize_datetime(document.get('fetched_at'))
            for document in documents
            if document.get('fetched_at')
        ),
        default=None,
    )
    for document in documents:
        document['published_date'] = _normalize_datetime(document.get('published_date'))
    return documents, refreshed


def _refresh_feeds(current_app):
    articles = []
    feed_urls = FEED_URLS
    for feed_url in feed_urls:
        try:
            articles.extend(_rss_articles(feed_url))
        except (requests.RequestException, ET.ParseError, ValueError):
            current_app.logger.warning(
                'Unable to retrieve mango articles from RSS host %s',
                urlparse(feed_url).netloc,
            )

    deduplicated = {}
    for article in articles:
        deduplicated[article['source_url']] = article
    return _sort_articles(list(deduplicated.values()))


def get_latest_mango_articles(current_app, limit=6):
    global _MEMORY_ARTICLES, _MEMORY_REFRESHED_AT

    now = datetime.now(timezone.utc)
    with _CACHE_LOCK:
        if (
            _MEMORY_REFRESHED_AT
            and now - _MEMORY_REFRESHED_AT < CACHE_TTL
        ):
            memory_articles = [
                article
                for article in _MEMORY_ARTICLES
                if is_valid_mango_article(article)
            ]
            if memory_articles:
                return [
                    _serialize_article(article)
                    for article in memory_articles[:limit]
                ]

        collection = None
        cached_articles = []
        cached_at = None
        try:
            from db import get_db

            collection = get_db()['mango_articles']
            collection.create_index('source_url', unique=True)
            collection.create_index('fetched_at')
            cached_articles, cached_at = _read_cache(collection)
        except Exception:
            current_app.logger.warning(
                'Mango article MongoDB cache is unavailable; using in-memory fallback',
                exc_info=True,
            )
            collection = None

        if cached_articles and cached_at and now - cached_at < CACHE_TTL:
            _MEMORY_ARTICLES = _sort_articles(cached_articles)
            _MEMORY_REFRESHED_AT = cached_at
            return [
                _serialize_article(article)
                for article in _MEMORY_ARTICLES[:limit]
            ]

        scraped_articles = _refresh_feeds(current_app)
        available_articles = (
            scraped_articles + cached_articles + _fallback_articles(now)
            if scraped_articles
            else _fallback_articles(now)
        )
        combined = {}
        for article in available_articles:
            source_url = article.get('source_url')
            if is_valid_mango_article(article) and source_url not in combined:
                combined[source_url] = article

        refreshed_articles = _sort_articles(list(combined.values()))[:MAX_ARTICLES]
        for article in refreshed_articles:
            article['fetched_at'] = now

        if collection is not None:
            try:
                for article in refreshed_articles:
                    collection.update_one(
                        {'source_url': article['source_url']},
                        {'$set': article},
                        upsert=True,
                    )
            except Exception:
                current_app.logger.warning(
                    'Unable to persist refreshed mango articles to MongoDB',
                    exc_info=True,
                )

        _MEMORY_ARTICLES = refreshed_articles
        _MEMORY_REFRESHED_AT = now
        return [_serialize_article(article) for article in refreshed_articles[:limit]]
