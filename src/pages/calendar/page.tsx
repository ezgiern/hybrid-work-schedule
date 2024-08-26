import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  GridItem,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { useRouter } from "next/router";

const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 9:00 - 18:00
const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function Calendar() {
  const [selectedLocation, setSelectedLocation] = useState<{
    [key: string]: string;
  }>({});
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [cellNotes, setCellNotes] = useState<{ [key: string]: string }>({});
  const [remoteDays, setRemoteDays] = useState<number>(0);
  const [showAlert, setShowAlert] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCellNoteOpen,
    onOpen: onCellNoteOpen,
    onClose: onCellNoteClose,
  } = useDisclosure();
  const [currentDay, setCurrentDay] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentCell, setCurrentCell] = useState<string | null>(null);
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userId = localStorage.getItem("user_id")?.trim();

        if (!userId) {
          console.error("User ID is not found in localStorage.");
        } else {
          console.log(`user_id fetched from localStorage: ${userId}`);
        }

        if (!userId) {
          throw new Error("User ID not found in localStorage");
        }

        const response = await fetch(
          `http://localhost:3000/api/users?user_id=${encodeURIComponent(
            userId
          )}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }

        const user = await response.json();

        if (!user.id) {
          throw new Error("User ID not found in the response");
        }

        setEmployeeId(user.id);
        setRemoteDays(user.weekly_remote_days);

        const scheduleResponse = await fetch(
          `http://localhost:3000/api/schedule/${encodeURIComponent(user.id)}`
        );

        if (!scheduleResponse.ok) {
          throw new Error(
            `Failed to fetch schedule: ${scheduleResponse.statusText}`
          );
        }

        console.log("User ID:", user.id);
        console.log("Schedule response:", scheduleResponse);

        const scheduleData = await scheduleResponse.json();
        console.log("Schedule Data:", scheduleData);

        const newSelectedLocation: { [key: string]: string } = {};
        scheduleData.schedule.forEach((entry: any) => {
          newSelectedLocation[entry.day] = entry.location;
        });

        setSelectedLocation(newSelectedLocation);
      } catch (error) {
        console.error("Failed to fetch user or schedule", error);
        setShowAlert("User not found");
      }
    }

    fetchUser();
  }, []);

  const handleLocationChange = async (day: string, location: string) => {
    if (employeeId === null) return;

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: employeeId,
          day,
          location,
          note: notes[day] || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setShowAlert(error.error);
      } else {
        setSelectedLocation((prev) => ({ ...prev, [day]: location }));
        if (location === "Home") {
          setRemoteDays(remoteDays + 1);
        }
        setShowAlert(null);
      }
    } catch (error) {
      setShowAlert("Failed to save the schedule.");
    }

    if (location === "Home") {
      setCurrentDay(day);
      onOpen();
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentDay) {
      setNotes((prev) => ({ ...prev, [currentDay]: e.target.value }));
    }
  };

  const handleSaveNote = async () => {
    if (currentDay && employeeId !== null) {
      try {
        const response = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: employeeId,
            day: currentDay,
            location: selectedLocation[currentDay],
            note: notes[currentDay] || "",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          setShowAlert(error.error);
        } else {
          setShowAlert(null);
        }
      } catch (error) {
        setShowAlert("Failed to save the note.");
      }
    }
    onClose();
  };

  const handleCellNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentCell) {
      setCellNotes((prev) => ({ ...prev, [currentCell]: e.target.value }));
    }
  };

  const handleSaveCellNote = () => {
    onCellNoteClose();
  };

  const handleCellClick = (day: string, hour: number) => {
    setCurrentCell(`${day}-${hour}`);
    onCellNoteOpen();
  };

  const startDate = addWeeks(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    currentWeek
  );

  return (
    <Box bg="#FFFAF0" minHeight="100vh" p={4}>
      {showAlert && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {showAlert}
        </Alert>
      )}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Button
          boxShadow="md"
          bg="#FBD38D"
          onClick={() => setCurrentWeek(currentWeek - 1)}
        >
          Previous Week
        </Button>
        <Text fontSize="2xl">
          {`${format(startDate, "MMMM d")} - ${format(
            addDays(startDate, 6),
            "MMMM d"
          )}`}
        </Text>
        <Button
          boxShadow="md"
          bg="#FBD38D"
          onClick={() => setCurrentWeek(currentWeek + 1)}
        >
          Next Week
        </Button>
      </Box>

      <Grid templateColumns="repeat(8, 1fr)" gap={2}>
        <GridItem>{/* Saat başlıkları*/}</GridItem>
        {daysOfWeek.map((day, index) => (
          <GridItem key={day} textAlign="center" fontWeight="bold">
            <Text>{day}</Text>
            <Text fontSize="sm" color="gray.600">
              {format(addDays(startDate, index), "EEE, MMM d")}
            </Text>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                mt={2}
                bg="#FBD38D"
                width="160px"
                textAlign="left"
                boxShadow="sm"
                isDisabled={day === "Saturday" || day === "Sunday"}
              >
                {selectedLocation[day] || "Select Location"}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => handleLocationChange(day, "Office")}>
                  Office
                </MenuItem>
                <MenuItem onClick={() => handleLocationChange(day, "Home")}>
                  Home
                </MenuItem>
              </MenuList>
            </Menu>
            {notes[day] && (
              <Text mt={2} fontSize="sm" color="gray.600">
                Note: {notes[day]}
              </Text>
            )}
          </GridItem>
        ))}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <GridItem mt="15px" textAlign="center" fontWeight="medium">
              {hour}:00
            </GridItem>
            {daysOfWeek.map((day) => (
              <GridItem
                key={`${day}-${hour}`}
                borderWidth="1px"
                height="60px"
                _hover={{ bg: "#FEEBC8", cursor: "pointer" }}
                onClick={() => handleCellClick(day, hour)}
              >
                {cellNotes[`${day}-${hour}`] && (
                  <Text fontSize="sm" color="gray.600">
                    {cellNotes[`${day}-${hour}`]}
                  </Text>
                )}
              </GridItem>
            ))}
          </React.Fragment>
        ))}
      </Grid>

      <Modal isOpen={isOpen} onClose={handleSaveNote}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enter Note for {currentDay}</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Enter your note here"
              value={currentDay ? notes[currentDay] || "" : ""}
              onChange={handleNoteChange}
            />
          </ModalBody>
          <ModalFooter>
            <Button bg="#FBD38D" mr={3} onClick={handleSaveNote}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCellNoteOpen} onClose={handleSaveCellNote}>
        <ModalOverlay />
        <ModalContent bg="#FFFAF0">
          <ModalHeader>{currentCell}</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Enter your note here"
              value={currentCell ? cellNotes[currentCell] || "" : ""}
              onChange={handleCellNoteChange}
            />
          </ModalBody>
          <ModalFooter>
            <Button bg="#FBD38D" mr={3} onClick={handleSaveCellNote}>
              Save
            </Button>
            <Button bg="#9C4221" color="white" onClick={onCellNoteClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
