import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';

export default function UploadOptionScreen({ navigation }) {
  const textAnim = useRef(new Animated.Value(0)).current;
  const pdfAnim = useRef(new Animated.Value(0)).current;

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [textData, setTextData] = useState('');
  const [uploadMode, setUploadMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const textStyle = {
    transform: [{ translateY: textAnim }],
  };

  const pdfStyle = {
    transform: [{ translateY: pdfAnim }],
  };

  useEffect(() => {
    Animated.timing(textAnim, {
      toValue: -50,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(pdfAnim, {
      toValue: 50,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPdfFile(result);
        Alert.alert('File Selected', result.assets[0].name);
      }
    } catch (error) {
      console.error('PDF selection error:', error);
      Alert.alert('Error', 'Failed to pick PDF file');
    }
  };

  const handlePDFUpload = async () => {
    if (!title.trim() || !textData.trim() || !pdfFile || pdfFile.canceled || !pdfFile.assets?.[0]) {
      Alert.alert('Error', 'Please fill all fields and select a PDF file');
      return;
    }

    setLoading(true);
    setUploadSuccess(false);
    setUploadError('');

    const formData = new FormData();
    const file = pdfFile.assets[0];
    
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'document.pdf',
      type: file.mimeType || 'application/pdf',
    } as any);
    
    formData.append('title', title);
    formData.append('description', textData);
    formData.append('tags', tags);

    try {
      const response = await axios.post(`${getBackendUrl()}/upload/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadSuccess(true);
      Alert.alert('Success', 'PDF uploaded successfully!');
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload PDF');
      Alert.alert('Error', 'Failed to upload PDF');
    } finally {
      setLoading(false);
    }
  };

  const handlePostText = async () => {
    if (!title.trim() || !textData.trim()) {
      Alert.alert('Error', 'Please enter both title and description');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${getBackendUrl()}/post/post`, {
        title,
        description: textData,
      });

      Alert.alert('Success', 'Text post created successfully!');
      resetForm();
    } catch (error) {
      console.error('Post error:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setTags('');
    setTextData('');
    setUploadMode(null);
    setPdfFile(null);
    setUploadSuccess(false);
    setUploadError('');
  };

  const getFileName = () => {
    if (pdfFile && !pdfFile.canceled && pdfFile.assets?.[0]) {
      return `Selected PDF: ${pdfFile.assets[0].name}`;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}

      {!uploadMode ? (
        <>
          <Animated.View style={[styles.option, textStyle]}>
            <Pressable
              style={({ pressed }) => [styles.optionBtn, pressed && { transform: [{ scale: 0.95 }] }]}
              onPress={() => setUploadMode('text')}
            >
              <LinearGradient colors={['#4c68d7', '#6f86f1']} style={styles.gradient}>
                <AntDesign name="edit" size={20} color="white" />
                <Text style={styles.btnText}>Upload Text</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.option, pdfStyle]}>
            <Pressable
              style={({ pressed }) => [styles.optionBtn, pressed && { transform: [{ scale: 0.95 }] }]}
              onPress={() => setUploadMode('pdf')}
            >
              <LinearGradient colors={['#ff5f6d', '#ffc371']} style={styles.gradient}>
                <AntDesign name="pdffile1" size={20} color="white" />
                <Text style={styles.btnText}>Upload PDF</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </>
      ) : (
        <View style={styles.textInputContainer}>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.inputBox}
            placeholderTextColor="#aaa"
          />

          <TextInput
            placeholder="Description"
            value={textData}
            onChangeText={setTextData}
            multiline
            style={[styles.inputBox, { height: 120 }]}
            placeholderTextColor="#aaa"
          />

          {uploadMode === 'pdf' && (
            <>
              <TextInput
                placeholder="Tags (comma separated)"
                value={tags}
                onChangeText={setTags}
                style={styles.inputBox}
                placeholderTextColor="#aaa"
              />

              {getFileName() && (
                <Text style={styles.fileName}>{getFileName()}</Text>
              )}

              <Pressable style={styles.uploadPdfButton} onPress={handlePickPDF}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {pdfFile ? 'Change PDF File' : 'Select PDF File'}
                </Text>
              </Pressable>

              <Pressable style={styles.postButton} onPress={handlePDFUpload}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Upload PDF</Text>
              </Pressable>

              <Pressable
                style={[styles.postButton, { backgroundColor: '#ccc', marginTop: 10 }]}
                onPress={resetForm}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </Pressable>
            </>
          )}

          {uploadMode === 'text' && (
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.postButton, { backgroundColor: '#ccc' }]}
                onPress={resetForm}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.postButton} onPress={handlePostText}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  Post Text
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafe'
  },
  option: {
    position: 'absolute',
    bottom: 160,
    alignItems: 'center'
  },
  optionBtn: {
    width: 160,
    height: 55,
    borderRadius: 30,
    elevation: 5,
    marginBottom: 15,
  },
  gradient: {
    flex: 1,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  textInputContainer: {
    position: 'absolute',
    top: '30%',
    zIndex: 10,
    width: '90%',
    backgroundColor: '#f9fafe',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  inputBox: {
    height: 50,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  postButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    marginTop: 10,
  },
  uploadPdfButton: {
    marginTop: 10,
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  fileName: {
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#666',
  },
});