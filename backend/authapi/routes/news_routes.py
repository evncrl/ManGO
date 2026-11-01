from flask import Blueprint, current_app, jsonify, request

from services.news_scraper import get_latest_mango_articles, is_valid_mango_article


news_bp = Blueprint('news', __name__)


@news_bp.route('/mango-articles', methods=['GET'])
def mango_articles():
    try:
        limit = int(request.args.get('limit', 6))
    except (TypeError, ValueError):
        return jsonify({
            'success': False,
            'error': 'limit must be an integer between 3 and 6',
        }), 400

    if not 3 <= limit <= 6:
        return jsonify({
            'success': False,
            'error': 'limit must be between 3 and 6',
        }), 400

    try:
        articles = get_latest_mango_articles(current_app, limit)
        articles = [
            article for article in articles
            if is_valid_mango_article(article)
        ][:limit]
        return jsonify({
            'success': True,
            'articles': articles,
        })
    except Exception:
        current_app.logger.exception('Unable to load Philippine mango articles')
        return jsonify({
            'success': False,
            'error': 'Mango news is temporarily unavailable',
        }), 500
