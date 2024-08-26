import React, { useState } from "react";
import { Box, Input, Button, Text, Stack, Heading } from "@chakra-ui/react";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the user ID in localStorage
        localStorage.setItem("user_id", data.user.id);

        // Redirect the user after successful login
        alert("Login successful");
        router.push("/calendar/page");
      }
    } catch (err) {
      setError("An error occurred while logging in.");
    }
  };

  return (
    <Box
      bg="#FFFAF0"
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg="white"
        p="8"
        rounded="lg"
        shadow="lg"
        borderWidth="1px"
        maxW="sm"
        w="100%"
      >
        <Heading
          textAlign="center"
          mb="6"
          fontSize="3xl"
          fontWeight="semibold"
          color="gray.600"
        >
          LOGIN
        </Heading>
        <form onSubmit={handleSubmit}>
          <Stack spacing="4">
            {error && <Text color="red.500">{error}</Text>}
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              focusBorderColor="teal.500"
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              focusBorderColor="teal.500"
            />
            <Button
              type="submit"
              bg="#FBD38D"
              color="white"
              width="160px"
              left="80px"
              _hover={{ bg: "#ECC94B" }}
            >
              Login
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
