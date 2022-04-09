import { Text, NativeBaseProvider, Center, FlatList, VStack, Pressable, extendTheme } from 'native-base';
import React, {useState} from 'react';

export default function App() {
    const [audio, setAudio] = useState([
        { name: 'audio1', key: '1' },
        { name: 'audio2', key: '2' },
        { name: 'audio3', key: '3' },
        { name: 'audio4', key: '4' },
        { name: 'audio5', key: '5' },
        { name: 'audio6', key: '6' },
    ]);

    return (
        <NativeBaseProvider>
            <Center bg='hsl(0, 0%, 97%)' h='100%'>
            <Center h='70%'>
                <Center mt="-5%" shadow="4" rounded={25} bg='red.400' alignItems="center" justifyContent="center" w={50} h={50} mb="5%">
                <Text bold color='white' fontSize={25} fontFamily="AppleSDGothicNeo-Bold">&#127798;</Text>
                </Center>
                <Center mb='15%'>
                <FlatList
                    data={audio}
                    renderItem={({ item }) => (
                        <VStack space={audio.length-1} alignItems="center">
                        <Pressable w="64" h="60" bg="white" rounded={15} mt={3} mb={3} shadow="1" alignItems="center" justifyContent="center">
                        <Text>{item.name}</Text>    
                        </Pressable>
                        </VStack>
                    )}
                />
                </Center>
            <Pressable bg='red.400' w='100px' h='100px' rounded={50} mt='-50px' alignItems='center' justifyContent='center' shadow="4">
                <Text>Record</Text>
            </Pressable>
            </Center>
            </Center>
        </NativeBaseProvider>
    );
}

