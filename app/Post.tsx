import React, { useState } from "react";
import { Center, Pressable, HStack, Button, Box, IconButton } from "native-base";
import { GetPostsQuery } from "./generated/graphql";
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

export type Unpacked<T> = T extends (infer U)[] ? U : T;


export function Post(post: Unpacked<GetPostsQuery['getPosts']['data']>) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);

  async function playAudio(uri: string | null) {
    if (!uri) {
      return alert("error");
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const { sound } = await Audio.Sound.createAsync({ uri });
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate)

    await sound.playAsync();
  }

  const onPlaybackStatusUpdate = ({ durationMillis, positionMillis }: any) => {
    if (duration !== durationMillis) {
      setDuration(durationMillis);
    }

    if (positionMillis === durationMillis) {
      setCurrentTime(0);
    } else {
      setCurrentTime(positionMillis);
    }
  }

  return (
    <Center>
      <Pressable _pressed={{ bg: 'gray.100' }}  w="64" h="60" bg="white" rounded={15} mt={3} mb={3} shadow="1" alignItems="center" justifyContent="center">
        <HStack space={6} w="100%" justifyContent="center">
          <IconButton icon={<Ionicons name="play" size={24} color="white" />} colorScheme="red" bg="red.400" onPress={() => playAudio(post.url)} />
          <Box w="1/2">
            <Slider
              value={currentTime}
              maximumValue={duration}
              minimumValue={0}
              thumbTintColor="#eb605b"
              minimumTrackTintColor="gray"
            />
          </Box>
        </HStack>
      </Pressable>
    </Center>

  );
}
