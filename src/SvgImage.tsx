import React, { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

const getHTML = (svgContent: any, style: any) => `
<html data-key="key-${style.height}-${style.width}">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
        background-color: transparent;
      }
      svg {
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>
`;

const SvgImage = ({ uri: string }) => {
  const [data, setData] = useState()

  useEffect(() => {
    if (uri) {
      if (uri.match(/^data:image\/svg/)) {
        const index = uri.indexOf('<svg')
        setData(uri.slice(index))
      } else {
        try {
          (async function getHtml() {
            const res = await fetch(uri)
            const text = await res.text()
            setData(text)
          })()
        } catch (err) {
          console.error('got error', err)
        }
      }
    }
  }, [])


  return (
    <View pointerEvents="none" style={styles.container}>
      <WebView
        source={{ html?: getHTML(data, styles.svg) }}
        originWhitelist={['*']}
        scalesPageToFit={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.webview}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    padding: 10
  },
  webview: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
  },
  svg: {
    width: 40,
    height: 40,
  }
})

export default SvgImage

