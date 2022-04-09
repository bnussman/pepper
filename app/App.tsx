import { Text, NativeBaseProvider, Center, FlatList, VStack, Pressable, extendTheme } from 'native-base';
import React, {useState} from 'react';
import { Audio } from 'expo-av';

export default function App() {
    const [recording, setRecording] = React.useState();
    const [recordings, setRecordings] = React.useState([]);
    const [message, setMessage] = React.useState("");

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();

            if (permission.status === "granted") {
                console.log("recording...");
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
                );

                setRecording(recording);
            } else {
                setMessage("Please grant permission to app to access microphone");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording(){
        console.log("stopped recording...");
        setRecording(undefined);
        await recording.stopAndUnloadAsync();

        let updatedRecordings = [...recordings];
        const { sound, status } = await recording.createNewLoadedSoundAsync();
        updatedRecordings.push({
            sound: sound,
            file: recording.getURI()
        });

        setRecordings(updatedRecordings);
    }

    async function playAudio(uri: string) {
        console.log('Loading Sound');
        const { sound } = await Audio.Sound.createAsync({ uri });
        console.log('Playing Sound');
        await sound.playAsync();
    }

    return (
        <NativeBaseProvider>
            <Center bg='hsl(0, 0%, 97%)' h='100%'>
                <Center h='70%'>
                    <Center mt="-5%" shadow="4" rounded={25} bg='red.400' alignItems="center" justifyContent="center" w={50} h={50} mb="5%">
                        <Text bold color='white' fontSize={25} fontFamily="AppleSDGothicNeo-Bold">&#127798;</Text>
                    </Center>
                    <Center mb='15%'>
                        <FlatList
                            data={recordings}
                            renderItem={({ item }) => (
                                <VStack space={recordings.length-1} alignItems="center">
                                    <Pressable onPress={() => playAudio(item.file)} title="Play" w="64" h="60" bg="white" rounded={15} mt={3} mb={3} shadow="1" alignItems="center" justifyContent="center">
                                        <Text>{item.file}</Text>    
                                    </Pressable>
                                </VStack>
                            )}
                        />
                    </Center>
                    <Pressable bg='red.400' w='100px' h='100px' rounded={50} mt='-50px' alignItems='center' justifyContent='center' shadow="4" onPressIn={startRecording} onPressOut={stopRecording}>
                        <Text>Record</Text>
                    </Pressable>
                </Center>
            </Center>
        </NativeBaseProvider>
    );
}

