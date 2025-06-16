import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";

type PdfWebViewerRouteProp = RouteProp<{ PdfWebViewer: { fileUrl: string } }, 'PdfWebViewer'>;

const PdfWebViewer: React.FC = () => {
  const route = useRoute<PdfWebViewerRouteProp>();
  const { fileUrl } = route.params;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(fileUrl)}` }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator size="large" color="blue" style={styles.loader} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
});

export default PdfWebViewer;
