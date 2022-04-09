import React, { useState } from 'react';
import { Text, NativeBaseProvider, Center, FlatList, VStack, Pressable, } from 'native-base';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import { gql, useMutation, useQuery } from '@apollo/client';
import { CreatePostMutation, GetPostsQuery } from './generated/graphql';
import { generateRNFile, isMobile } from './utils/constants';

const CreatePost = gql`
    mutation CreatePost($audio: Upload!) {
      createPost(audio: $audio) {
        id
        url
        created
      }
    }
`;

const Posts = gql`
    query GetPosts {
      getPosts {
        data {
          id
          url
          created
        }
        count
      }
    }
`;

export function Feed() {
    const [post] = useMutation<CreatePostMutation>(CreatePost);
    const { data, loading, error } = useQuery<GetPostsQuery>(Posts);
    const [recording, setRecording] = useState<Recording>();

    const posts = data?.getPosts.data;

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
                alert("no perms");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording(){
        console.log("stopped recording...");

        await recording?.stopAndUnloadAsync();

        const finishedRecording = await recording?.createNewLoadedSoundAsync();

        if (!finishedRecording || !recording) {
            return alert("error");
        }

        const uri = recording.getURI();

        if (!uri) {
            return alert("oh no");
        }

        let real;

        if (!isMobile) {
            const res = await fetch(uri);
            const blob = await res.blob();
            const fileType = blob.type.split("/")[1];
            const file = new File([blob], "photo." + fileType);
            real = file;
        } else {
            const fileType = uri.split(".")[1];
            const file = generateRNFile(uri, `file.${fileType}`);
            real = file;
        }

        post({
            variables: {
                audio: real
            }
        })
            .then(() => alert("success"))
            .catch((e) => console.error(e));

        /*
        updatedRecordings.push({
            sound: finishedRecording.sound,
            file: recording.getURI()
        });

        setRecording(undefined);
        setRecordings(updatedRecordings);
        */
    }

    async function playAudio(uri: string | null) {
        if (!uri) {
            return alert("error");
        }
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
                            data={posts || []}
                            renderItem={({ item }) => (
                                <VStack space={4} alignItems="center">
                                    <Pressable onPress={() => playAudio(item.url)} w="64" h="60" bg="white" rounded={15} mt={3} mb={3} shadow="1" alignItems="center" justifyContent="center">
                                        <Text>{item.created}</Text>    
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

