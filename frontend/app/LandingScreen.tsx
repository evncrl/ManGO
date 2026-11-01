import React, { useRef, useEffect, useState } from "react";
import { Linking } from "react-native";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  FlatList,
} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { router } from "expo-router";
// import { API_URL } from "@/config/appconf"; 
import { useLandingStyles } from "@/styles/LandingScreen.styles";
import { useResponsive } from '@/utils/platform';
// import * as ImagePicker from 'expo-image-picker';
import Footer from '@/components/Footer';
import { useUser } from '@/contexts/UserContext';
import DurianHeatmap from '@/components/DurianHeatmap';
import { API_URL } from '@/config/appconf';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthUI } from '@/contexts/AuthUIContext';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, useAnimatedScrollHandler } from 'react-native-reanimated';

// Animated Component for Hover Effect
const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { AnimatedImage } from '@/components/ui/AnimatedImage';
import { VideoSection } from '@/components/VideoSection';
import { interpolate, useDerivedValue, withRepeat, withSequence, withDelay, withTiming } from "react-native-reanimated";

interface LandingArticle {
  id: string;
  title: string;
  desc: string;
  image: { uri: string };
  icon: keyof typeof Ionicons.glyphMap;
  url?: string;
}

const MANGO_IMAGE_URL =
  'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=85';

const FALLBACK_ARTICLES: LandingArticle[] = [
  {
    id: 'mango-ai-defect-detection',
    title: 'AI-Powered Carabao Mango Defect Detection',
    desc: 'How computer vision can help identify surface defects and support consistent mango grading.',
    image: { uri: MANGO_IMAGE_URL },
    icon: 'scan-outline',
  },
  {
    id: 'mango-export-standards',
    title: 'PNS/BAFS Export Standards for Fresh Mangoes',
    desc: 'A practical overview of quality, handling, and post-harvest requirements for export-ready mangoes.',
    image: {
      uri: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=85&sat=-15',
    },
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'mango-anthracnose-management',
    title: 'Managing Mango Anthracnose & Stem-End Rot',
    desc: 'Learn about common mango diseases and integrated practices that protect fruit quality.',
    image: {
      uri: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=85&hue=15',
    },
    icon: 'leaf-outline',
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseArticles = (payload: unknown): LandingArticle[] => {
  const records = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.articles)
      ? payload.articles
      : [];

  return records.flatMap((record, index) => {
    if (!isRecord(record) || typeof record.title !== 'string' || !record.title.trim()) {
      return [];
    }

    const description =
      typeof record.description === 'string'
        ? record.description
        : typeof record.desc === 'string'
          ? record.desc
          : '';
    const imageValue = record.imageUrl ?? record.image_url ?? record.image;
    const imageUrl =
      typeof imageValue === 'string'
        ? imageValue
        : isRecord(imageValue) && typeof imageValue.url === 'string'
          ? imageValue.url
          : MANGO_IMAGE_URL;
    const url = typeof record.url === 'string' ? record.url : undefined;

    return [{
      id: String(record.id ?? `article-${index}`),
      title: record.title.trim(),
      desc: description,
      image: { uri: imageUrl },
      icon: 'newspaper-outline',
      ...(url ? { url } : {}),
    }];
  });
};

const AnimatedIndicator = ({ index, currentIndex }: { index: number, currentIndex: number }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = index === currentIndex;
    const widthValue = withSpring(isActive ? 24 : 8, { damping: 15 });
    const opacityValue = withSpring(isActive ? 1 : 0.4);
    const backgroundValue = isActive ? Palette.deepObsidian : Palette.stoneGray;

    return {
      width: widthValue,
      opacity: opacityValue,
      backgroundColor: backgroundValue,
    };
  });

  return <Animated.View style={[{ height: 8, borderRadius: 4, marginHorizontal: 4 }, animatedStyle]} />;
};

const InteractiveCard = ({ children, style, onPress }: any) => {
  const scale = useSharedValue(1);
  const shadow = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: withSpring(shadow.value * 0.1),
    elevation: withSpring(shadow.value * 8),
  }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97);
        shadow.value = withSpring(1.5);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
        shadow.value = withSpring(1);
      }}
      activeOpacity={0.9}
    >
      {children}
    </AnimatedPressable>
  );
};

const HeroItem = ({ item, scrollY, width, floatStyle }: any) => {
  const styles = useLandingStyles();
  const parallaxStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 500],
      [0, 150]
    );
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={{ width, backgroundColor: Palette.canvas, overflow: 'hidden' }}>
      <View style={{ position: "relative" }}>
        <Animated.View style={parallaxStyle}>
          <AnimatedImage
            source={item.image}
            style={styles.heroBanner}
            entering={FadeInDown.duration(800).delay(200)}
          />
        </Animated.View>
        <LinearGradient
          colors={['rgba(253, 248, 242, 0.08)', 'rgba(253, 248, 242, 0.78)', Palette.canvas]}
          style={styles.heroTextOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Animated.View style={floatStyle}>
            <Animated.Text
              entering={FadeInDown.duration(800).delay(400)}
              style={[styles.heroTitle, { color: Palette.charcoal }]}
            >
              {item.title}
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(800).delay(600)}
              style={[styles.heroSubtitle, { color: Palette.body }]}
            >
              {item.subtitle}
            </Animated.Text>
          </Animated.View>
        </LinearGradient>
      </View>
    </View>
  );
};

const DynamicSection = ({ section, scrollY, width, plotlyLoaded, setPlotlyLoaded, user, openAuthModal }: any) => {
  const styles = useLandingStyles();

  return (
    <View style={section.style || (styles as any)[section.styleName]}>
      {section.title && (
        <ScrollReveal scrollY={scrollY}>
          <Animated.Text
            entering={FadeInDown.duration(800).delay(200)}
            style={[styles.sectionTitle, section.titleStyle]}
          >
            {section.title}
          </Animated.Text>
        </ScrollReveal>
      )}
      {section.subtitle && (
        <ScrollReveal scrollY={scrollY}>
          <Animated.Text
            entering={FadeInDown.duration(800).delay(300)}
            style={[styles.aboutSubtitle, section.subtitleStyle]}
          >
            {section.subtitle}
          </Animated.Text>
        </ScrollReveal>
      )}

      {section.type === 'hero' && (
        <View style={styles.heroContent}>
          <FlatList
            ref={section.flatListRef}
            data={section.data}
            renderItem={({ item }) => (
              <HeroItem
                item={item}
                scrollY={scrollY}
                width={width}
                floatStyle={section.floatStyle}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              section.onIndexChange(newIndex);
            }}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          />
          <View style={styles.indicatorsContainer}>
            {section.data.map((_: any, index: number) => (
              <AnimatedIndicator key={index} index={index} currentIndex={section.currentIndex} />
            ))}
          </View>
          <Animated.View
            entering={FadeInDown.duration(800).delay(800)}
            style={styles.heroButtons}
          >
            {!user && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => openAuthModal('login')}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Get Started
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      )}

      {section.type === 'grid' && (
        <View style={styles.missionCardsContainer}>
          {section.data.map((item: any, index: number) => (
            <ScrollReveal key={index} scrollY={scrollY} style={styles.card} index={index}>
              <InteractiveCard style={{ flex: 1 }} onPress={() => { }}>
                <View style={styles.missionIconContainer}>
                  <Ionicons name={item.icon} size={32} color={Palette.warmCopper} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </InteractiveCard>
            </ScrollReveal>
          ))}
        </View>
      )}

      {section.type === 'scroll' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.articlesScrollContainer}>
          {section.data.map((article: any, index: number) => (
            <ScrollReveal key={article.id} scrollY={scrollY} index={index}>
              <InteractiveCard
                style={styles.articleCard}
                onPress={() => article.url && Linking.openURL(article.url)}
              >
                <AnimatedImage
                  source={article.image}
                  style={styles.articleImage}
                  entering={FadeInDown.duration(600).delay(200 + index * 100)}
                />
                <View style={styles.articleContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name={article.icon} size={16} color={Palette.warmCopper} style={{ marginRight: 6 }} />
                    <Text style={styles.articleTitle} numberOfLines={1}>{article.title}</Text>
                  </View>
                  <Text style={styles.articleDesc} numberOfLines={3}>{article.desc}</Text>
                </View>
              </InteractiveCard>
            </ScrollReveal>
          ))}
        </ScrollView>
      )}

      {section.type === 'custom' && section.id === 'heatmap' && (
        <ScrollReveal
          scrollY={scrollY}
          style={{
            flexDirection: width < 600 ? 'column' : 'row',
            gap: 24,
            justifyContent: 'center',
            alignItems: 'flex-start',
            marginVertical: 24,
          }}
        >
          <View style={width < 600 ? { width: '100%', marginTop: 24 } : { flex: 1, minWidth: 320, maxWidth: 600 }}>
            <DurianHeatmap
              mapMode={'heatmap'}
              onMapModeChange={() => { }}
              onRegionSelect={() => { }}
              plotlyLoaded={plotlyLoaded}
              onPlotlyLoad={() => setPlotlyLoaded(true)}
            />
          </View>
        </ScrollReveal>
      )}

      {section.type === 'video' && (
        <VideoSection
          videoId={section.videoId}
          scrollY={scrollY}
          width={width}
          index={1} // Hardcoded index for now as it's the second section
        />
      )}
    </View>
  );
};

function Landing({ }: any) {
  // All hooks must be declared at the top, before any conditional or early return
  const { user } = useUser();
  const { openAuthModal } = useAuthUI();
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [articles, setArticles] = useState<LandingArticle[]>(FALLBACK_ARTICLES);

  // Animation Values
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const { isWeb, isSmallScreen, isMediumScreen, isLargeScreen, width } = useResponsive();
  const styles = useLandingStyles();
  const scrollRef = useRef<ScrollView | null>(null);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [anchors, setAnchors] = useState<{ home: number; about: number }>({ home: 0, about: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);

  const floatValue = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatValue.value, [0, 1], [0, -10]) }],
  }));

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(`${API_URL}/api/articles?topic=mango`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const fetchedArticles = parseArticles(await response.json());
        if (fetchedArticles.length > 0) setArticles(fetchedArticles);
      })
      .catch(() => {
        // Keep the local mango article cards when the optional endpoint is unavailable.
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);
  // Remove all local modal/auth state and handlers


  const carouselData = [
    {
      id: "1",
      title: "Know Your Mango Instantly",
      subtitle: "AI-powered quality analysis for damage, disease & export standards",
      image: { uri: MANGO_IMAGE_URL },
    },
    {
      id: "2",
      title: "Fast & Accurate Analysis",
      subtitle: "Get instant AI-powered quality assessment in seconds",
      image: { uri: MANGO_IMAGE_URL },
    },
    {
      id: "3",
      title: "Early Detection Matters",
      subtitle: "Identify damage and disease before it's too late",
      image: { uri: MANGO_IMAGE_URL },
    },
  ];

  const SECTIONS = [
    {
      id: 'home',
      type: 'hero',
      styleName: 'heroSection',
      data: carouselData,
      flatListRef: flatListRef,
      currentIndex: currentIndex,
      onIndexChange: (idx: number) => setCurrentIndex(idx),
      onLayout: (e: any) => { const y = e.nativeEvent?.layout?.y ?? 0; setAnchors(prev => ({ ...prev, home: y })); },
      floatStyle: floatStyle
    },
    {
      id: 'video-demo',
      type: 'video',
      videoId: 'EXK6yQCQ93Q',
      styleName: 'videoSection', // Ensure this style exists or use inline
      title: "Watch Our Story",
      subtitle: "Discover the journey behind our mango quality assurance and AI grading.",
      titleStyle: { color: '#1C1917', textAlign: 'center', marginTop: 40 },
      subtitleStyle: { color: '#57534E', textAlign: 'center', marginBottom: 20 },
    },
    {
      id: 'mission',
      type: 'grid',
      title: "Our Mission",
      subtitle: "Empowering mango farmers with cutting-edge AI for quality assurance and sustainable practices.",
      styleName: 'missionSection',
      titleStyle: { color: Palette.charcoal },
      subtitleStyle: { color: Palette.body },
      data: [
        { title: "Precision Analysis", desc: "Our AI models are trained on thousands of samples for pinpoint accuracy.", icon: "flask-outline" },
        { title: "Farmer Empowerment", desc: "Supporting local growers with data-driven insights and fair market standards.", icon: "people-outline" },
        { title: "Global Standards", desc: "Setting the benchmark for mango export quality with automated consistency.", icon: "globe-outline" },
      ]
    },
    {
      id: 'articles',
      type: 'scroll',
      title: "Latest Articles",
      subtitle: "Stay informed with the newest trends and research in mango cultivation and AI.",
      styleName: 'featuredArticlesSection',
      titleStyle: { color: Palette.deepObsidian },
      subtitleStyle: { color: Palette.charcoalEspresso, fontStyle: 'italic' },
      data: articles,
    },
    {
      id: 'heatmap',
      type: 'custom',
      styleName: 'heatmapContainer',
    }
  ];

  const startAutoScroll = () => {
    stopAutoScroll();

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex === carouselData.length - 1 ? 0 : prevIndex + 1;
        try {
          if (flatListRef.current?.scrollToIndex) {
            flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
          } else if (flatListRef.current?.scrollToOffset) {
            flatListRef.current.scrollToOffset({ offset: nextIndex * width, animated: true });
          }
        } catch (e) {
          // Fallback if measurement isn't available yet
          try {
            flatListRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
          } catch (err) {
            console.warn('Carousel scroll error:', err);
          }
        }
        return nextIndex;
      });
    }, 4000) as any;
  };

  const stopAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [width]);

  useEffect(() => {
    const checkScroll = setInterval(() => {
      setShowScrollTop(scrollY.value > 200);
    }, 100);
    return () => clearInterval(checkScroll);
  }, []);

  return (
    <View style={styles.safeArea}>

      <Animated.ScrollView
        ref={scrollRef as any}
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* DYNAMIC SECTIONS ENGINE */}
        {SECTIONS.map((section) => (
          <DynamicSection
            key={section.id}
            section={section}
            scrollY={scrollY}
            width={width}
            plotlyLoaded={plotlyLoaded}
            setPlotlyLoaded={setPlotlyLoaded}
            user={user}
            openAuthModal={openAuthModal}
          />
        ))}

        {/* FOOTER */}
        <Animated.View entering={FadeInUp.duration(1000).delay(800)}>
          <Footer />
        </Animated.View>
      </Animated.ScrollView>
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopButton}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Text style={styles.scrollTopButtonText}>↑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default Landing;
