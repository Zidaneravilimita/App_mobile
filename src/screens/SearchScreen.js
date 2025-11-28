// src/screens/SearchScreen.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import EventCard from "../components/EventCard";
import { supabase } from "../config/supabase";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { ms, hp, wp } from "../theme/responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [villes, setVilles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);
  const [sortBy, setSortBy] = useState("date_asc"); // date_asc, date_desc, popularity
  const [page, setPage] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showVillePicker, setShowVillePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const RESULTS_PER_PAGE = 20;
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  const RECENT_SEARCHES_KEY = "recent_searches";
  const CACHE_KEY_PREFIX = "search_cache_";
  
  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
    // Debug: vérifier la connexion Supabase
    console.log('Supabase client:', supabase);
    console.log('Supabase URL:', supabase.supabaseUrl);
    console.log('Supabase key present:', !!supabase.supabaseKey);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return unsubscribe;
  }, []);

  // Debounce query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery !== undefined) {
      performSearch(true); // reset page
    }
  }, [debouncedQuery, selectedVilleId, selectedCategoryId, sortBy]);

  // Forcer le chargement des données au démarrage
  useEffect(() => {
    console.log('=== DÉMARRAGE CHARGEMENT DONNÉES ===');
    fetchVilles();
    fetchCategories();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    try {
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 8);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const getCacheKey = useCallback(() => {
    const key = `${debouncedQuery || ""}_${selectedVilleId}_${selectedCategoryId}_${sortBy}`;
    return `${CACHE_KEY_PREFIX}${btoa(key).replace(/[^a-zA-Z0-9]/g, '')}`;
  }, [debouncedQuery, selectedVilleId, selectedCategoryId, sortBy]);

  const getCachedResults = useCallback(async () => {
    try {
      const key = getCacheKey();
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to get cached results:', error);
    }
    return null;
  }, [getCacheKey]);

  const cacheResults = useCallback(async (data) => {
    try {
      const key = getCacheKey();
      const value = JSON.stringify({
        data,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to cache results:', error);
    }
  }, [getCacheKey]);

  const fetchVilles = async () => {
    try {
      console.log('=== DÉBUT FETCH VILLES ===');
      console.log('Supabase client disponible:', !!supabase);
      
      // Test simple de connexion
      console.log('Test connexion Supabase...');
      const { data: testData, error: testError } = await supabase
        .from('ville')
        .select('count')
        .limit(1);
      
      console.log('Test connexion - data:', testData, 'error:', testError);
      
      if (testError) {
        console.error('ERREUR CONNEXION:', testError);
        throw testError;
      }
      
      // Requête complète
      console.log('Requête complète villes...');
      const { data, error } = await supabase
        .from('ville')
        .select('id_ville, nom_ville')
        .order('nom_ville');
      
      console.log('Résultat villes - data:', data, 'error:', error);
      
      if (error) {
        console.error('Erreur villes:', error);
        throw error;
      }
      
      console.log('Villes chargées avec succès:', data?.length || 0, 'éléments');
      setVilles(data || []);
    } catch (error) {
      console.error('ECHEC TOTAL fetchVilles:', error);
      setVilles([]);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('=== DÉBUT FETCH CATÉGORIES ===');
      
      // Test simple de connexion
      console.log('Test connexion categories...');
      const { data: testData, error: testError } = await supabase
        .from('category')
        .select('count')
        .limit(1);
      
      console.log('Test connexion categories - data:', testData, 'error:', testError);
      
      if (testError) {
        console.error('ERREUR CONNEXION categories:', testError);
        throw testError;
      }
      
      // Requête complète
      console.log('Requête complète categories...');
      const { data, error } = await supabase
        .from('category')
        .select('id_category, nom_category')
        .order('nom_category');
      
      console.log('Résultat categories - data:', data, 'error:', error);
      
      if (error) {
        console.error('Erreur catégories:', error);
        throw error;
      }
      
      console.log('Catégories chargées avec succès:', data?.length || 0, 'éléments');
      setCategories(data || []);
    } catch (error) {
      console.error('ECHEC TOTAL fetchCategories:', error);
      setCategories([]);
    }
  };

  const performSearch = async (resetPage = false) => {
    if (resetPage) {
      setPage(0);
      setHasMore(true);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Save to recent searches when user actually searches
      if (resetPage && debouncedQuery.trim()) {
        saveRecentSearch(debouncedQuery.trim());
      }

      // Try cache first when offline or for initial load
      if (!isConnected || resetPage) {
        const cached = await getCachedResults();
        if (cached) {
          setResults(resetPage ? cached : [...results, ...cached]);
          if (!isConnected) {
            setLoading(false);
            setLoadingMore(false);
            return;
          }
        }
      }

      // If offline and no cache, stop here
      if (!isConnected) {
        setResults([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const currentPage = resetPage ? 0 : page;
      const from = currentPage * RESULTS_PER_PAGE;
      const to = from + RESULTS_PER_PAGE - 1;

      let queryBuilder = supabase
        .from('events')
        .select('id_event, id_user, titre, description, date_event, image_url, id_ville, id_category, lieu_detail, category:category!events_id_category_fkey (nom_category)', { count: 'exact' })
        .range(from, to);

      // Filtre par titre
      if (debouncedQuery.trim()) {
        queryBuilder = queryBuilder.ilike('titre', `%${debouncedQuery.trim()}%`);
      }

      // Filtre par ville
      if (selectedVilleId !== 'all') {
        queryBuilder = queryBuilder.eq('id_ville', selectedVilleId);
      }

      // Filtre par catégorie
      if (selectedCategoryId !== 'all') {
        queryBuilder = queryBuilder.eq('id_category', selectedCategoryId);
      }

      // Sorting
      switch (sortBy) {
        case 'date_asc':
          queryBuilder = queryBuilder.order('date_event', { ascending: true });
          break;
        case 'date_desc':
          queryBuilder = queryBuilder.order('date_event', { ascending: false });
          break;
        case 'popularity':
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
          break;
      }

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      const newResults = data || [];
      
      if (resetPage) {
        setResults(newResults);
        if (newResults.length > 0) {
          cacheResults(newResults);
        }
      } else {
        setResults(prev => [...prev, ...newResults]);
      }

      // Update pagination state
      const totalFetched = (currentPage + 1) * RESULTS_PER_PAGE;
      setHasMore(count ? totalFetched < count : newResults.length === RESULTS_PER_PAGE);
      
      if (resetPage) {
        setPage(1);
      } else {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      if (resetPage) {
        Alert.alert('Erreur', 'Impossible de rechercher les événements');
        setResults([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedVilleId('all');
    setSelectedCategoryId('all');
    setSortBy('date_asc');
  };

  const handleEventPress = (event) => {
    navigation.navigate("EventDetails", { event });
  };

  const handleRecentSearchPress = (searchQuery) => {
    setQuery(searchQuery);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      performSearch(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    performSearch(true);
  };

  const renderRecentSearches = () => {
    if (recentSearches.length === 0 || query.trim()) return null;
    
    return (
      <View style={styles.recentSection}>
        <Text style={[styles.recentTitle, { color: colors.text }]}>Recent Searches</Text>
        <View style={styles.recentChips}>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.recentChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleRecentSearchPress(search)}
            >
              <Ionicons name="time-outline" size={14} color={colors.muted} />
              <Text style={[styles.recentChipText, { color: colors.text }]}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.empty}>
        <Ionicons name="search" size={ms(56)} color={colors.muted} />
        <Text style={[styles.emptyText, { color: colors.text }]}>No Events Found</Text>
        <Text style={[styles.emptySub, { color: colors.subtext }]}>
          {isConnected ? 'Try widening your filters or search terms.' : 'Check your internet connection and try again.'}
        </Text>
        {!isConnected && (
          <View style={[styles.offlineBanner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
            <Ionicons name="wifi-off" size={16} color={colors.error} />
            <Text style={[styles.offlineText, { color: colors.error }]}>You're offline</Text>
          </View>
        )}
        {recentSearches.length > 0 && !query.trim() && renderRecentSearches()}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {!isConnected && (
          <View style={[styles.offlineBanner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
            <Ionicons name="wifi-off" size={16} color={colors.error} />
            <Text style={[styles.offlineText, { color: colors.error }]}>You're offline - showing cached results</Text>
          </View>
        )}
        
        <FlatList
          style={styles.list}
          data={results}
          renderItem={({ item }) => (
            <EventCard 
              event={item} 
              onPress={() => handleEventPress(item)} 
            />
          )}
          keyExtractor={item => item.id_event.toString()}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <View style={styles.backRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Ionicons name="arrow-back" size={ms(20)} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.title, { color: colors.text }]}>Search Events</Text>

              <View style={styles.searchRow}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}> 
                  <Ionicons name="search" size={ms(16)} color={colors.muted} style={{ marginRight: ms(8) }} />
                  <TextInput
                    placeholder="Search by title..."
                    placeholderTextColor={colors.subtext}
                    value={query}
                    onChangeText={setQuery}
                    style={[styles.input, { color: colors.text }]}
                    returnKeyType="search"
                    onSubmitEditing={() => performSearch(true)}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.searchButton, { backgroundColor: colors.primary }]} 
                  onPress={() => performSearch(true)}
                >
                  <Ionicons name="search" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Recent searches when query is empty */}
              {!query.trim() && recentSearches.length > 0 && renderRecentSearches()}

              <View style={styles.rowFilters}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    { backgroundColor: colors.surface, borderColor: colors.border }
                  ]}
                  onPress={() => setShowVillePicker(true)}
                >
                  <Ionicons name="location-outline" size={16} color={colors.text} />
                  <Text style={[styles.filterButtonText, { color: colors.text }]}>
                    {selectedVilleId === 'all' ? 'All Cities' : villes.find(v => v.id_ville === selectedVilleId)?.nom_ville || 'All Cities'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    { backgroundColor: colors.surface, borderColor: colors.border }
                  ]}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <Ionicons name="grid-outline" size={16} color={colors.text} />
                  <Text style={[styles.filterButtonText, { color: colors.text }]}>
                    {selectedCategoryId === 'all' ? 'All Categories' : categories.find(c => c.id_category === selectedCategoryId)?.nom_category || 'All Categories'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    { backgroundColor: sortBy === 'popularity' ? colors.primary : colors.surface, borderColor: sortBy === 'popularity' ? colors.primary : colors.border }
                  ]}
                  onPress={() => setSortBy(sortBy === 'popularity' ? 'date_asc' : 'popularity')}
                >
                  <Ionicons 
                    name="trending-up-outline" 
                    size={16} 
                    color={sortBy === 'popularity' ? '#fff' : colors.text} 
                  />
                  <Text style={[
                    styles.filterButtonText,
                    { color: sortBy === 'popularity' ? '#fff' : colors.text }
                  ]}>
                    Popular
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Modal Ville */}
              <Modal
                visible={showVillePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowVillePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Select City</Text>
                      <TouchableOpacity onPress={() => setShowVillePicker(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={[{ id_ville: 'all', nom_ville: 'All Cities' }, ...villes]}
                      keyExtractor={item => item.id_ville}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.modalItem, { backgroundColor: selectedVilleId === item.id_ville ? colors.primary + '20' : 'transparent' }]}
                          onPress={() => {
                            setSelectedVilleId(item.id_ville);
                            setShowVillePicker(false);
                          }}
                        >
                          <Text style={[styles.modalItemText, { color: colors.text }]}>
                            {item.nom_ville}
                          </Text>
                          {selectedVilleId === item.id_ville && (
                            <Ionicons name="checkmark" size={16} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </Modal>

              {/* Modal Catégorie */}
              <Modal
                visible={showCategoryPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCategoryPicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
                      <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={[{ id_category: 'all', nom_category: 'All Categories' }, ...categories]}
                      keyExtractor={item => item.id_category}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.modalItem, { backgroundColor: selectedCategoryId === item.id_category ? colors.primary + '20' : 'transparent' }]}
                          onPress={() => {
                            setSelectedCategoryId(item.id_category);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <Text style={[styles.modalItemText, { color: colors.text }]}>
                            {item.nom_category}
                          </Text>
                          {selectedCategoryId === item.id_category && (
                            <Ionicons name="checkmark" size={16} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </Modal>

              
              
              <TouchableOpacity 
                style={[styles.clearButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={clearFilters}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.text} />
                <Text style={[styles.clearButtonText, { color: colors.text }]}>Clear Filters</Text>
              </TouchableOpacity>

              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                Results ({results.length})
                {results.length > 0 && !isConnected && (
                  <Text style={[styles.cacheBadge, { color: colors.muted }]}> (cached)</Text>
                )}
              </Text>
            </View>
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          windowSize={10}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: ms(16),
  },
  headerContent: {
    paddingBottom: ms(16),
  },
  title: {
    fontSize: ms(22),
    fontWeight: 'bold',
    marginBottom: ms(16),
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: ms(16),
    gap: ms(8),
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    fontSize: ms(16),
    paddingVertical: 0,
  },
  searchButton: {
    padding: ms(12),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowFilters: {
    flexDirection: 'row',
    gap: ms(8),
    marginBottom: ms(16),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    borderRadius: ms(10),
    borderWidth: 1,
    gap: ms(6),
    minHeight: ms(44),
  },
  filterButtonText: {
    fontSize: ms(14),
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  hiddenPickers: {
    position: 'absolute',
    left: -9999,
    opacity: 0,
  },
  hiddenPicker: {
    height: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    maxHeight: hp(70),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(16),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: ms(18),
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(16),
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalItemText: {
    fontSize: ms(16),
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(10),
    paddingHorizontal: ms(16),
    borderRadius: ms(10),
    borderWidth: 1,
    marginBottom: ms(16),
    gap: ms(8),
  },
  clearButtonText: {
    fontSize: ms(14),
    fontWeight: '500',
  },
  resultsTitle: {
    fontSize: ms(18),
    fontWeight: 'bold',
    marginBottom: ms(12),
  },
  cacheBadge: {
    fontSize: ms(12),
    fontWeight: 'normal',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: ms(32),
  },
  emptyText: {
    fontSize: ms(18),
    fontWeight: '600',
    marginTop: ms(12),
    textAlign: 'center',
  },
  emptySub: {
    fontSize: ms(12),
    marginTop: ms(6),
    textAlign: 'center',
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: ms(8),
  },
  backButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  recentSection: {
    marginBottom: ms(16),
  },
  recentTitle: {
    fontSize: ms(14),
    fontWeight: '600',
    marginBottom: ms(8),
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(16),
    borderWidth: 1,
    gap: ms(6),
  },
  recentChipText: {
    fontSize: ms(12),
    fontWeight: '500',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(8),
    paddingHorizontal: ms(16),
    borderWidth: 1,
    borderRadius: ms(8),
    marginVertical: ms(8),
    gap: ms(8),
  },
  offlineText: {
    fontSize: ms(12),
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: ms(20),
    alignItems: 'center',
  },
});