import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { FileText, FilePlus } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Document } from '../../types/document.ts';
import { getDocuments, deleteDocument, uploadDocument } from '../../services/documentService.ts';
import DocumentCard from '../../components/DocumentCard.tsx';
import EmptyState from '../../components/EmptyState.tsx';

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const styles = getStyles(colors);

  const loadDocuments = async () => {
    try {
      if (!user) return;
      const docs = await getDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const handleUploadDocument = async () => {
    try {
      setUploadingDoc(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploadingDoc(false);
        return;
      }

      if (!user) {
        setUploadingDoc(false);
        Alert.alert('Upload Failed', 'User not authenticated.');
        return;
      }

      const file = result.assets[0];

      // Ensure the file object has a 'type' property
      const fileWithType = {
        name: file.name,
        uri: file.uri,
        size: file.size ?? 0,
        type: file.mimeType || 'application/octet-stream',
      };

      const uploadedDoc = await uploadDocument(fileWithType, user.id); // ✅ Use real upload function

      setDocuments([uploadedDoc, ...documents]); // ✅ Add new doc to list
      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;
              await deleteDocument(documentId, user.id);
              setDocuments(documents.filter(doc => doc.id !== documentId));
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Delete Failed', 'Failed to delete document. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSelectDocument = (document: Document) => {
    router.push({
      pathname: '/chat',
      params: { documentId: document.id, documentTitle: document.title }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.uploadButton} 
        onPress={handleUploadDocument}
        disabled={uploadingDoc}
      >
        {uploadingDoc ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <FilePlus size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </>
        )}
      </TouchableOpacity>

      {documents.length === 0 ? (
        <EmptyState 
          icon={<FileText size={64} color={colors.textSecondary} />}
          title="No documents yet"
          message="Upload your first document to get started"
          actionLabel="Upload Document"
          onAction={handleUploadDocument}
        />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onPress={() => handleSelectDocument(item)}
              onDelete={() => handleDeleteDocument(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
});