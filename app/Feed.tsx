import React, { useState, useEffect } from 'react';
import { Text, Center, FlatList, VStack, Pressable, Spinner, Heading, } from 'native-base';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import { gql, useMutation, useQuery } from '@apollo/client';
import { CreatePostMutation, GetPostsQuery } from './generated/graphql';
import { generateRNFile, isMobile } from './utils/constants';
import { RefreshControl, Vibration } from 'react-native';

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
    query GetPosts($limit: Int, $offset: Int) {
        getPosts(limit: $limit, offset: $offset) {
        data {
          id
          url
          created
        }
        count
      }
    }
`;

const NewPost = gql`
  subscription NewPost {
    newPost {
      id
      url
      created
    }
  }
`;

const MAX_PAGE_SIZE = 10;

export function Feed() {
    const [post] = useMutation<CreatePostMutation>(CreatePost);
    const { data, loading, error, fetchMore, refetch, subscribeToMore } = useQuery<GetPostsQuery>(Posts, {
        variables: {
            offset: 0,
            limit: MAX_PAGE_SIZE,
        },
        notifyOnNetworkStatusChange: true
    });
    const [recording, setRecording] = useState<Recording>();
    const posts = data?.getPosts.data;
    const isRefreshing = Boolean(data) && loading;
    const count = data?.getPosts.count || 0;

    const getMore = () => {
        console.log("loading morloading moree");
        const canLoadMore = posts && posts.length < count;

        if (!canLoadMore || isRefreshing) return;

        fetchMore({
            variables: {
                offset: posts?.length || 0,
                limit: MAX_PAGE_SIZE
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) {
                    return prev;
                }

                return {
                    getPosts: {
                        data: [...prev.getPosts.data, ...fetchMoreResult.getPosts.data],
                        count: fetchMoreResult.getPosts.count
                    }
                };
            }
        });
    };

    useEffect(() => {
        subscribeToMore({
            document: NewPost,
            updateQuery: (prev, { subscriptionData }) => {
                Vibration.vibrate(1000);
                // @ts-ignore how is this type still incorrect apollo, you're trash
                const post = subscriptionData.data.newPost;
                return {
                    getPosts: {
                        data: [post, ...prev.getPosts.data],
                        count: prev.getPosts.count + 1
                    }
                };
            }
        });
    }, []);

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

        setRecording(undefined);
    }

    async function playAudio(uri: string | null) {
        if (!uri) {
            return alert("error");
        }
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });
        const { sound } = await Audio.Sound.createAsync({ uri });
        await sound.playAsync();
    }

    const renderFooter = () => {
        if (!isRefreshing) return null;

        return (
            <Center>
                <Spinner mt={4} mb={9} color="gray.400" />
            </Center>
        );
    };

    if (error) {
        return (
            <Center bg='hsl(0, 0%, 97%)' h='100%'>
                <Heading size="3xl">🚫️</Heading>
                <Text fontSize="lg">{error?.message || "Unable to load feed"}</Text>
            </Center>
        );
    }

    if (!data && loading) {
        return (
            <Center bg='hsl(0, 0%, 97%)' h='100%'>
                <Spinner color="gray.400" size="lg" />
            </Center>
        );
    }

    return (
        <Center bg='hsl(0, 0%, 97%)' h='100%'>
            <Center h='70%'>
                <Center shadow="4" rounded={25} bg='red.400' alignItems="center" justifyContent="center" w={50} h={50} mb="5%">
                    <Text bold color='white' fontSize={25} fontFamily="AppleSDGothicNeo-Bold">&#127798;</Text>
                </Center>
                <Center mb='15%'>
                    <FlatList
                        data={posts || []}
                        keyExtractor={(post) => post.id}
                        onEndReached={getMore}
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={renderFooter()}
                        renderItem={({ item }) => (
                            <VStack space={4} alignItems="center">
                                <Pressable _pressed={{ bg: 'gray.100' }} onPress={() => playAudio(item.url)} w="64" h="60" bg="white" rounded={15} mt={3} mb={3} shadow="1" alignItems="center" justifyContent="center">
                                    <Text>{new Date(item.created).toLocaleTimeString()}</Text>    
                                </Pressable>
                            </VStack>
                        )}
                        refreshControl={
                            <RefreshControl
                                tintColor="#cfcfcf"
                                refreshing={isRefreshing}
                                onRefresh={refetch}
                            />
                        }

                    />
                </Center>
                <Pressable _pressed={{ bg: 'red.500' }} bg='red.400' w='100px' h='100px' rounded={50} mt='-50px' alignItems='center' justifyContent='center' shadow="4" onPressIn={startRecording} onPressOut={stopRecording}>
                    <Text>Record</Text>
                </Pressable>
            </Center>
        </Center>
    );
}

