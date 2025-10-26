import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Switch } from 'react-native-paper';

export default function TeacherHomeScreen({ navigation }) {
  const [isAvailable, setIsAvailable] = React.useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.greeting}>
          Good Morning, Teacher!
        </Text>
        <Text variant="bodyLarge" style={styles.date}>
          {new Date().toLocaleDateString()}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.availabilityRow}>
            <View>
              <Text variant="titleLarge">Availability Status</Text>
              <Text variant="bodyMedium" style={styles.statusText}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
            <Switch value={isAvailable} onValueChange={setIsAvailable} />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.statsTitle}>Today's Teaching</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">4</Text>
              <Text variant="bodySmall">Lectures</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">3</Text>
              <Text variant="bodySmall">Sections</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">85%</Text>
              <Text variant="bodySmall">Workload</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="calendar-clock"
          onPress={() => navigation.navigate('Schedule')}
          style={styles.actionButton}
        >
          View Schedule
        </Button>
        <Button
          mode="outlined"
          icon="chart-bar"
          onPress={() => navigation.navigate('Workload')}
          style={styles.actionButton}
        >
          Workload Stats
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 20,
    backgroundColor: '#2c3e50',
  },
  greeting: {
    color: '#fff',
    fontWeight: 'bold',
  },
  date: {
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: '#2c3e50',
    marginTop: 4,
  },
  statsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});

