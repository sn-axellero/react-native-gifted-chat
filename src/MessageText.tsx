import PropTypes from 'prop-types'
import React from 'react'
import {
  Linking,
  StyleSheet,
  View,
  ViewPropTypes,
  TextProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native'

// @ts-ignore
import ParsedText from 'react-native-parsed-text'
// @ts-ignore
import HTMLView from 'react-native-htmlview'
import Communications from 'react-native-communications'
import SvgImage from './SvgImage';
import { LeftRightStyle, IMessage } from './types'

const WWW_URL_PATTERN = /^www\./i

const textStyle = {
  fontSize: 16,
  lineHeight: 20,
  marginTop: 5,
  marginBottom: 5,
  marginLeft: 10,
  marginRight: 10,
}
const textStyle2 = {
  fontSize: 16,
  lineHeight: 20,
  marginTop: 0,
  marginBottom: 0,
  marginVertical: 0,
  marginLeft: 10,
  marginRight: 10,
};

const styles = {
  left: StyleSheet.create({
    container: {},
    text: {
      color: 'black',
      ...textStyle,
    },
    text2: {
      color: 'black',
      ...textStyle2,
    },
    link: {
      color: 'black',
      textDecorationLine: 'underline',
    },
    htmlContainer: {
      marginTop: 5
    },
  }),
  right: StyleSheet.create({
    container: {},
    text: {
      color: 'white',
      ...textStyle,
    },
    text2: {
      color: 'white',
      ...textStyle2,
    },
    link: {
      color: 'white',
      textDecorationLine: 'underline',
    },
  }),
}

const DEFAULT_OPTION_TITLES = ['Call', 'Text', 'Cancel']

export interface MessageTextProps<TMessage extends IMessage> {
  position: 'left' | 'right'
  optionTitles?: string[]
  currentMessage?: TMessage
  containerStyle?: LeftRightStyle<ViewStyle>
  textStyle?: LeftRightStyle<TextStyle>
  linkStyle?: LeftRightStyle<TextStyle>
  textProps?: TextProps
  customTextStyle?: StyleProp<TextStyle>
  parsePatterns?(linkStyle: TextStyle): any
  onLinkPress?(meta: any, url: string): any
}

export default class MessageText<
  TMessage extends IMessage = IMessage
> extends React.Component<MessageTextProps<TMessage>> {
  static contextTypes = {
    actionSheet: PropTypes.func,
  }

  static defaultProps = {
    position: 'left',
    optionTitles: DEFAULT_OPTION_TITLES,
    currentMessage: {
      text: '',
    },
    containerStyle: {},
    textStyle: {},
    linkStyle: {},
    customTextStyle: {},
    textProps: {},
    parsePatterns: () => [],
  }

  static propTypes = {
    position: PropTypes.oneOf(['left', 'right']),
    optionTitles: PropTypes.arrayOf(PropTypes.string),
    currentMessage: PropTypes.object,
    containerStyle: PropTypes.shape({
      left: ViewPropTypes.style,
      right: ViewPropTypes.style,
    }),
    textStyle: PropTypes.shape({
      left: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
      right: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    }),
    linkStyle: PropTypes.shape({
      left: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
      right: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    }),
    parsePatterns: PropTypes.func,
    textProps: PropTypes.object,
    customTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  }

  shouldComponentUpdate(nextProps: MessageTextProps<TMessage>) {
    return (
      !!this.props.currentMessage &&
      !!nextProps.currentMessage &&
      this.props.currentMessage.text !== nextProps.currentMessage.text
    )
  }

  onUrlPress = (url: string) => {
    // When someone sends a message that includes a website address beginning with "www." (omitting the scheme),
    // react-native-parsed-text recognizes it as a valid url, but Linking fails to open due to the missing scheme.
    if (WWW_URL_PATTERN.test(url)) {
      this.onUrlPress(`http://${url}`)
    } else {
      Linking.canOpenURL(url).then(supported => {
        if (!supported) {
          console.error('No handler for URL:', url)
        } else {
          Linking.openURL(url)
        }
      })
    }
  }

  onPhonePress = (phone: string) => {
    const { optionTitles } = this.props
    const options =
      optionTitles && optionTitles.length > 0
        ? optionTitles.slice(0, 3)
        : DEFAULT_OPTION_TITLES
    const cancelButtonIndex = options.length - 1
    this.context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (buttonIndex: number) => {
        switch (buttonIndex) {
          case 0:
            Communications.phonecall(phone, true)
            break
          case 1:
            Communications.text(phone)
            break
          default:
            break
        }
      },
    )
  }

  onEmailPress = (email: string) =>
    Communications.email([email], null, null, null, null)

  render() {
    const linkStyle = [
      styles[this.props.position].link,
      this.props.linkStyle && this.props.linkStyle[this.props.position],
    ]
    let txt = this.props.currentMessage!.text
    const meta = this.props.currentMessage!.meta
    let content
    const check = meta && (meta.personality_test_request || meta.activity)
    if (!check && txt.substring(0, 3) === '<p>') {
      txt = txt.slice(3, -4)
    }
    if (check) {
      content = (
        <HTMLView
          value={txt}
          addLineBreaks={false}
          stylesheet={{
            a: linkStyle,
            p: styles[this.props.position].text2
          }}
          style={styles.left.htmlContainer}
          onLinkPress={(url: any) => this.props.onLinkPress ? this.props.onLinkPress(meta, url) : null}
        />
      )
    }
    else if (meta && meta.icebreaker) {
      content = (
        <SvgImage uri={meta.icebreaker_graphic} />
      )
    }
    else if (txt.charAt(0) === '<') {
        content = (
            <HTMLView value={txt} stylesheet={{
                a: linkStyle
            }}/>
        )
    }
    else {
        content = (
            <ParsedText
                style={[
                    styles[this.props.position].text,
                    this.props.textStyle && this.props.textStyle[this.props.position],
                    this.props.customTextStyle,
                ]}
                parse={[
                    ...this.props.parsePatterns!(linkStyle as TextStyle),
                    { type: 'url', style: linkStyle, onPress: this.onUrlPress },
                    { type: 'phone', style: linkStyle, onPress: this.onPhonePress },
                    { type: 'email', style: linkStyle, onPress: this.onEmailPress },
                ]}
                childrenProps={{ ...this.props.textProps }}
            >
                {txt}
            </ParsedText>
        )
    }
    return (
      <View
        style={[
          styles[this.props.position].container,
          this.props.containerStyle &&
            this.props.containerStyle[this.props.position],
        ]}
      >
        {content}
      </View>
    )
  }
}
