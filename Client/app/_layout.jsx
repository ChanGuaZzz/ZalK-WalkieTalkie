//Client/app/_layout.jsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import tw from 'twrnc';
import { Image, View, Text, SafeAreaView, TouchableOpacity, Modal, Alert } from 'react-native';
import ProfileIcon from '../assets/images/images.png';
import LoginScreen from './LoginScreen';
import ConfigIcon from '../components/shared/ConfigIcon';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColor } from '../hooks/useThemeColor';
import UserProfileModal from '../components/modals/UserProfileModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocketProvider } from '../components/context/SocketContext';
// import createSocket from "../components/context/CreateSocket";
import profilepicture from '../assets/images/emoGirlIcon.png';
import { Audio } from 'expo-av';
import NotificationsIcon from '../components/shared/NotificationsIcon';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import getEnvVars from '../config';
import Loading from '../components/shared/Loading';
const { SERVER_URL } = getEnvVars();
const { SOCKET_URL } = getEnvVars();

export default function RootLayout() {
  const [modalIconVisible, setModalIconVisible] = useState(false);
  const SoftbackgroundColor = useThemeColor({}, 'Softbackground');
  const textColor = useThemeColor({}, 'text');
  const RZ_Gradient_1 = useThemeColor({}, 'RZ_Gradient_1');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [userID, setUserID] = useState(null);
  const [info, setInfo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [auxconstIsloggedIn, setAuxconstIsloggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  // const [socketCreated, setSocketCreated] = useState(false);

  // ===== Creates socket connection for the user =====
  const createSocket = () => {
    if (isLoggedIn && username) {
      axios
        .get(`${SERVER_URL}/getsession`, { withCredentials: true })
        .then((res) => {
          const newsocket = io(SOCKET_URL, { query: { groups: res.data.user.groups, contacts: res.data.user.contacts, userID: res.data.user.id } });
          setSocket(newsocket);
          console.log('Conectado socket desde createSocket', newsocket);
        })
        .catch((error) => {
          console.log(error);
        });

      return () => {
        if (socket) {
          console.log('Desconectando socket desde createSocket');
          socket.disconnect();
        }
      };
    }
  };

  // ===== Skips the login if the user is already logged in ========
  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log('Checking login status');
      let loggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (loggedIn === 'true') {
        SetLayoutLogged(true);
      }
    };

    checkLoginStatus();
  }, []);

  // ===== Gets the state from the login screen =======
  const SetLayoutLogged = async (value) => {
    setIsLoggedIn(value);
    console.log('pulso el boton de login');
  };

  const getsession = async () => {
    console.log('Socket en RootLayout', socket);
    console.log('isloggedin en RootLayout', isLoggedIn);
    if (isLoggedIn /*&& !socketCreated */) {
      axios
        .get(`${SERVER_URL}/getsession`, { withCredentials: true })
        .then((res) => {
          setUsername(res.data.user.username);
          setIsBusy(res.data.user.isBusy);
          setUserID(res.data.user.id);
          setInfo(res.data.user.info);
          setProfilePicture(res.data.user.profilePicture);
          console.log('SE LOGUEO CORRECTAMENTE EL USUARIO', res.data.user);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  // ===== Gets the user data when the user is logged in =======
  useEffect(() => {
    getsession();
  }, [isLoggedIn]);

  // ===== Logout the user =======
  const handleLogout = async () => {
    axios
      .post(`${SERVER_URL}/logout`, {}, { withCredentials: true })
      .then((res) => {
        if (socket) {
          socket.disconnect();
          console.log('Socket desconectado en logout');
          setIsSocketConnected(false);
        }
        AsyncStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // ===== Creates the socket connection when the user is logged in =======
  useEffect(() => {
    console.log('Socket y isloggedIn y usuario', socket, isLoggedIn, username || 'nohay');
    if (username && isLoggedIn /* && !socketCreated*/) {
      createSocket();
      console.log('ENTRA A CREAR EL SOCKET CUANDO USERNAME ES', username, 'y el socket es ', socket);
    }
  }, [username]);

  // ===== Refreshes the user session when the socket is connected =======
  useEffect(() => {
    if (socket != null) {
      console.log('Socket creado en RootLayout', socket);
      socket.on('connect', () => {
        console.log('ESTA CONECTADO');
      });
      setLoading(false);
      setIsSocketConnected(true);
      socket.on('refreshcontacts', () => {
        console.log('refreshing session in RootLayout');
        axios
          .post(`${SERVER_URL}/refreshSession`, { id: userID }, { withCredentials: true })
          .then((res) => {
            setUsername(res.data.user.username);
            setInfo(res.data.user.info);
            setProfilePicture(res.data.user.profilePicture);

          })
          .catch((error) => {
            console.log(error);
          })
          .finally(() => {
            setLoading(false);
          });
      });

      socket.on('receive-audio', async (base64Audio, room) => {
        console.log('Received audio data from room', room);

        // Asegúrate de que el base64Audio no esté corrupto
        if (!base64Audio || base64Audio.length === 0) {
          console.error('Audio data is empty or corrupted');
          return;
        }

        const uri = `data:audio/mp3;base64,${base64Audio}`;
        console.log('audio enviado', uri);

        try {
          const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
          await sound.setVolumeAsync(1.0);
          await sound.playAsync();
          console.log('Playing sound');
          Alert.alert('playing sound');
        } catch (error) {
          Alert.alert('Error playing sound');
          console.error('Error playing sound:', error);
        }
      });

      return () => {
        socket.off('receive-audio');
      };
    }
  }, [socket]);

  // ===== Fetches the user profile picture =======
  useEffect(() => {
    fetchProfilePicture();
  }, [userID]);

  const fetchProfilePicture = async () => {
    if (!userID) return;
    try {
      console.log('userID: ', userID);
      const response = await axios.get(`${SERVER_URL}/get-image-url/${userID}`);
      setProfilePicture(response.data.profilePicture);
      console.log('response.data.profilePicture', response.data.profilePicture);
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {loading && (
          <Modal animationType="fade" transparent={true} onRequestClose={() => { }}>
            <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
              <Loading />
            </View>
          </Modal>
        )}
        {/* Alvaro comenta la linea de abajo u.u */}
        {isLoggedIn && socket ? (
          <SocketProvider socket={socket}>
            <Stack screenOptions={{ animation: 'slide_from_right' }}>
              {/* Tabs folder screens */}
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerLeft: () => (
                    <View style={tw`flex-row items-center `}>
                      <TouchableOpacity onPress={() => setModalIconVisible(true)}>
                        <Image source={profilePicture ? { uri: profilePicture } : ProfileIcon} style={tw`size-9 mr-2 rounded-full`} />
                        <UserProfileModal
                          user={{ name: username, info: info }}
                          modalIconVisible={modalIconVisible}
                          setModalIconVisible={setModalIconVisible}
                          iconSize={12}
                        />
                      </TouchableOpacity>
                      <Text style={tw`text-base font-semibold text-[${textColor}]`}>{username} </Text>
                      {isBusy && <Ionicons name="notifications-off" size={18} color="red" />}
                    </View>
                  ),
                  headerRight: () => (
                    <View style={tw`flex-row`}>
                      <NotificationsIcon />
                      <ConfigIcon setIsBusyLayout={setIsBusy} handleLogout={handleLogout} />
                    </View>
                  ),
                  headerTitle: '',
                  headerTitleAlign: 'center',
                  headerStyle: tw`bg-[${SoftbackgroundColor}]`,
                }}
              />
              {/* Add contacts */}
              <Stack.Screen
                name="AddContactsScreen"
                options={{
                  headerStyle: {
                    backgroundColor: SoftbackgroundColor, // Dark background color for the header
                  },
                  headerTintColor: textColor,
                  headerTitle: 'Add Contacts',
                }}
              />
              {/* Add groups */}
              <Stack.Screen
                name="AddGroupsScreen"
                options={{
                  headerStyle: {
                    backgroundColor: SoftbackgroundColor, // Dark background color for the header
                  },
                  headerTintColor: textColor,
                  headerTitle: 'Add Groups',
                }}
              />
              {/* Chat rooms | Private chats or groups */}
              <Stack.Screen
                name="ChatScreen"
                options={({ route }) => {
                  const user = route.params.user; // Correctly access the user object from route params
                  return {
                    headerStyle: {
                      backgroundColor: SoftbackgroundColor,
                    },
                    headerTintColor: textColor,
                    headerTitle: () => (
                      <TouchableOpacity onPress={() => setModalIconVisible(true)} style={tw`flex-1 w-full`}>
                        <View style={tw`flex-1 flex-row justify-start items-center w-full`}>
                          <UserProfileModal user={user} modalIconVisible={modalIconVisible} setModalIconVisible={setModalIconVisible} iconSize={12} />
                          <TouchableOpacity onPress={() => setModalIconVisible(true)} style={tw`ml-6`}>
                            <Image source={user.profile ?? profilepicture} style={tw`size-11 rounded-full`} />
                          </TouchableOpacity>
                          <Text style={tw`text-[${textColor}] font-bold text-lg ml-2`}>{user.name ?? 'Chat Room'}</Text>
                        </View>
                      </TouchableOpacity>
                    ),
                    headerLeft: () => <View style={{ marginLeft: -50 }} />,
                    headerRight: () => <ConfigIcon chatroom={true} setModalIconVisible={setModalIconVisible} user={user} />,
                  };
                }}
              />
              {/* Profile Settings */}
              <Stack.Screen
                name="ProfileSettingsScreen"
                options={{
                  headerStyle: {
                    backgroundColor: SoftbackgroundColor, // Dark background color for the header
                  },
                  headerTintColor: textColor,
                  headerTitle: 'Settings',
                }}
              />
              {/* Profile photo */}
              <Stack.Screen
                name="ProfilePictureScreen"
                options={{
                  headerStyle: {
                    backgroundColor: SoftbackgroundColor,
                  },
                  headerTintColor: textColor,
                  headerTitle: 'Profile Photo',
                }}
              />
              {/* NotificationsScreen */}
              <Stack.Screen
                name="NotificationsScreen"
                options={{
                  headerStyle: {
                    backgroundColor: SoftbackgroundColor,
                  },
                  headerTintColor: textColor,
                  headerTitle: 'Notifications',
                }}
              />
              {/* RandomZalkScreen */}
              <Stack.Screen
                name="RandomZalkScreen"
                options={{
                  headerStyle: {
                    backgroundColor: RZ_Gradient_1,
                  },
                  headerTintColor: "white",
                  headerTitle: 'Random ZalK',
                }}
              />
            </Stack>
          </SocketProvider>
        ) : (
          // Main login screen
          <LoginScreen setLoading={setLoading} SetLayoutLogged={SetLayoutLogged} />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
