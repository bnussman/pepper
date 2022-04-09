import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NativeBaseProvider } from 'native-base';

export default function App() {
    return (
        <NativeBaseProvider>
            <View style={styles.container}>
                <Text style={styles.logo}>Pepper</Text>
                <StatusBar style="auto" />
            </View>
        </NativeBaseProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'hsl(0, 0%, 98%)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        fontSize: 18,
        fontWeight: 'bold',

    },
});
