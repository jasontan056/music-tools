import { Container, Title, Text, Button, Stack, Center } from '@mantine/core';
import { Link } from 'react-router-dom';
import { APP_TITLE } from '@acme/common';

export const Home = () => {
    return (
        <Container size="sm" py="xl">
            <Center h="60vh">
                <Stack align="center" gap="lg">
                    <Title order={1} size="h1" fw={900}>
                        <Text component="span" inherit variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                            {APP_TITLE}
                        </Text>
                    </Title>
                    <Text size="xl" ta="center" c="dimmed">
                        A collection of interactive tools for musicians to explore theory, practice, and composition.
                    </Text>
                    <Button
                        component={Link}
                        to="/triads"
                        size="xl"
                        variant="filled"
                        color="blue"
                        radius="md"
                    >
                        Explore Triads
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
};
