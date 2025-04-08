import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Pressable, 
  Alert, 
  TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadOptionScreen({ navigation }) {
  const textAnim = useRef(new Animated.Value(0)).current;
  const pdfAnim = useRef(new Animated.Value(0)).current;
  
  // Local state to control the text input visibility and text data
  const [showTextInput, setShowTextInput] = useState(false);
  const [textData, setTextData] = useState('');

  useEffect(() => {
    Animated.stagger(300, [
      Animated.spring(textAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(pdfAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const textStyle = {
    transform: [
      { scale: textAnim },
      { translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -70] }) },
    ],
    opacity: textAnim,
  };

  const pdfStyle = {
    transform: [
      { scale: pdfAnim },
      { translateY: pdfAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }) },
    ],
    opacity: pdfAnim,
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        console.log('PDF URI:', result.uri);
        Alert.alert('PDF Selected', result.name);
      }
    } catch (error) {
      console.log('Error picking PDF:', error);
    }
  };

  const handlePostText = () => {
    if (textData.trim() === '') {
      Alert.alert('Error', 'Please write something');
      return;
    }
    Alert.alert('Posted', 'Your text has been posted');
    setTextData('');
    setShowTextInput(false);
  };

  return (
    <View style={styles.container}>
      {!showTextInput ? (
        <>
          <Animated.View style={[styles.option, textStyle]}>
            <Pressable
              style={({ pressed }) => [styles.optionBtn, pressed && { transform: [{ scale: 0.95 }] }]}
              onPress={() => setShowTextInput(true)}  // Instead of navigating, show text input
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
              onPress={pickPDF}
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
            placeholder="Write your text here..."
            value={textData}
            onChangeText={setTextData}
            multiline
            style={styles.inputBox}
            placeholderTextColor="#aaa"
          />
          <Pressable style={styles.postButton} onPress={handlePostText}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Post</Text>
          </Pressable>
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
    bottom: 160,
    width: '90%',
    backgroundColor: '#f9fafe',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  inputBox: {
    height: 150,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  postButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
});
