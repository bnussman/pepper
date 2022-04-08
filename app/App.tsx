import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
    return (
        <View style={styles.container}>
        <Text style={styles.logo}>Pepper</Text>
        <StatusBar style="auto" />
        </View>
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
        color: 'hsl(0, 100%, 45%)',
    },
});
