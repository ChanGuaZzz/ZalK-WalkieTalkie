import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import getEnvVars from '../../config';
const { SERVER_URL } = getEnvVars();
import { showAlert } from '../shared/ShowAlert';
import PasswordToggle from '../shared/PasswordToggle';

const ResetPasswordTokenModal = ({ setModalVisible, modalVisible, setLoadingLayout }) => {
  const modal_bg_color = useThemeColor({}, 'modal_bg_color');
  const modal_text_color = useThemeColor({}, 'modal_text_color');
  const modal_title_color = useThemeColor({}, 'modal_title_color');
  const accept_button_color = useThemeColor({}, 'Modal_accept_button');
  const decline_button_color = useThemeColor({}, 'Modal_cancel_button');
  const disabledText = useThemeColor({}, 'disabledText');
  const textcolor = useThemeColor({}, 'text');
  const { Texts } = useLanguage();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  const validateEmail = (email) => {
    if (email.length > 100) {
      return Texts.EmailTooLong;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 0 && !emailRegex.test(email)) {
      return Texts.InvalidEmail;
    }
    return '';
  };

  const validatePassword = (password) => {
    if (password.length > 0 && password.length < 8) {
      return Texts.Passwords8Characters;
    }
    if (password.length > 30) {
      return Texts.PasswordTooLong;
    }
    return '';
  };

  const handleNewPassword = () => {
    if (email.trim().length === 0 || token.trim().length === 0 || newPassword.trim().length === 0) {
      showAlert(Texts.ResetPassTokenFailedTitle, Texts.EmptyFields);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setFormError(emailError);
      showAlert(Texts.ResetPassTokenFailedTitle, emailError);
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setFormError(passwordError);
      showAlert(Texts.ResetPassTokenFailedTitle, passwordError);
      return;
    }

    setLoadingLayout(true);
    axios
      .post(`${SERVER_URL}/resetPassword`, { email, token, newPassword })
      .then((res) => {
        console.log('Password reset successfully', res.data);
        showAlert(Texts.ResetPasswordSuccessTitle, Texts.PasswordResetSuccess);
        setModalVisible(false);
        setLoadingLayout(false);
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
          showAlert(Texts.ResetPassTokenFailedTitle, Texts.InvalidToken);
        } else {
          showAlert(Texts.ResetPassTokenFailedTitle, Texts.ResetPasswordError);
        }
        setLoadingLayout(false);
        console.error('Error resetting password:', error);
      });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
      }}
    >
      <Pressable style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`} onPress={() => setModalVisible(false)}>
        <View style={tw`w-4/5 bg-${modal_bg_color} rounded-lg p-6 items-center shadow-lg`} onStartShouldSetResponder={() => true}>
          <TouchableOpacity style={tw`absolute top-2 right-2 p-2`} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={textcolor} />
          </TouchableOpacity>
          <Text style={[tw`text-xl font-bold mb-4 text-${modal_title_color} text-center`, styles.text]}>{Texts.ResetPassword}</Text>
          <Text style={[tw`text-base mb-4 text-${modal_text_color} text-center`, styles.text]}>{Texts.ResetPasswordText}</Text>

          <View style={tw`w-full `}>
            <TextInput
              style={[tw`border-b border-${modal_text_color} text-${modal_text_color} w-full py-2 px-3 rounded-lg text-left`, styles.textInput]}
              placeholder={Texts.EmailPlaceholder}
              placeholderTextColor={disabledText}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                const error = validateEmail(text);
                setFormError(text.length > 0 ? error : '');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[tw`border-b border-${modal_text_color} text-${modal_text_color} w-full py-2 px-3 rounded-lg text-left`, styles.textInput]}
              placeholder={Texts.TokenPlaceholder}
              placeholderTextColor={disabledText}
              value={token}
              onChangeText={(text) => setToken(text)}
            />
            <View style={tw`flex-row items-center border-b border-${modal_text_color} `}>
              <TextInput
                style={[tw`text-${modal_text_color} flex-1 py-2 px-3 rounded-lg text-left`, styles.textInput]}
                placeholder={Texts.NewPasswordPlaceholder}
                placeholderTextColor={disabledText}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  const error = validatePassword(text);
                  setFormError(text.length > 0 ? error : '');
                }}
                secureTextEntry={hidePassword}
              />
              <PasswordToggle hidePassword={hidePassword} setHidePassword={setHidePassword} />
            </View>
            <View style={tw`min-h-[35px] justify-center my-2`}>
              {formError ? <Text style={[tw`text-red-500 text-left`, styles.errorText]}>{formError}</Text> : null}
            </View>
          </View>

          <View style={tw`w-full `}>
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity style={tw`flex-1 bg-${decline_button_color} py-2 px-4 rounded-full mx-1`} onPress={() => setModalVisible(false)}>
                <Text style={tw`text-white font-bold text-center`}>{Texts.Cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`flex-1 bg-${accept_button_color} py-2 px-4 rounded-full mx-1`} onPress={handleNewPassword}>
                <Text style={tw`text-white font-bold text-center`}>{Texts.Send}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System',
  },
  textInput: {
    fontFamily: 'System',
    fontSize: 16,
  },
  errorText: {
    fontFamily: 'System',
    fontSize: 14,
  },
});

export default ResetPasswordTokenModal;
