import React, { useState, useEffect } from 'react';
import { Icon, Text, Center, FlatList, VStack, Pressable, Spinner, Heading, Box } from 'native-base';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import { gql, useMutation, useQuery } from '@apollo/client';
import { CreatePostMutation, GetPostsQuery } from './generated/graphql';
import { generateRNFile, isMobile } from './utils/constants';
import { RefreshControl, Vibration } from 'react-native';
import { SimpleLineIcons } from '@expo/vector-icons'; 
import { Post } from './Post';

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
                    { ...Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY, web: { mimeType: "audio/mp4" } }
                );

                setRecording(recording);
            } else {
                alert("no perms");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        /*
        const permission = await Audio.requestPermissionsAsync();

        if (permission.status !== "granted") {
            return;
        }
         */
        console.log(recording);
        if (!recording) return;

        console.log("stopped recording...");

        await recording?.stopAndUnloadAsync();

        const finishedRecording = await recording?.createNewLoadedSoundAsync();

        if (!finishedRecording || !recording) {
            return alert("error in stopRecording");
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
            .then(() => console.log("success"))
            .catch((e) => console.error(e));

        setRecording(undefined);
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
        <Center bg='hsl(0, 0%, 97%)' h="100%">
            <Center shadow="4" rounded={25} bg='red.400' alignItems="center" justifyContent="center" w={50} h={50} mb={6}>
                <Text bold color='white' fontSize={25} fontFamily="AppleSDGothicNeo-Bold">&#127798;</Text>
            </Center>
            <Center h={600} w="100%">
                <FlatList
                    w="100%"
                    data={posts || []}
                    keyExtractor={(post) => post.id}
                    onEndReached={getMore}
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={renderFooter()}
                    renderItem={({ item }) => (
                      <Post {...item} key={item.id} />
                    )}
                    refreshControl={
                        <RefreshControl
                            tintColor="#cfcfcf"
                            refreshing={isRefreshing}
                            onRefresh={refetch}
                        />
                    }
                />
                <Pressable userSelect={isMobile ? undefined : "none"} _pressed={{ bg: 'red.500' }} bg='red.400' w='100px' h='100px' rounded={50} mt='-50px' alignItems='center' justifyContent='center' shadow="4" onPressIn={startRecording} onPressOut={stopRecording}>
                    <Icon userSelect={isMobile ? undefined : "none"} as={SimpleLineIcons} name="microphone" size={9} color="white" />
                </Pressable>
            </Center>
        </Center>
    );
}

