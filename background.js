let isCapturing = false;
let currentStream = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start') {
        console.log('Starting audio capture for language:', request.lang);
        startAudioCapture(request.lang);
    } else if (request.action === 'stop') {
        console.log('Stopping audio capture');
        stopAudioCapture();
    }
});



function startAudioCapture(targetLang) {
    if (isCapturing) {
        console.log('Audio capture is already in progress');
        return;
    }

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        let currentTab = tabs[0];
        if (currentTab) {
            chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
                if (stream) {
                    console.log('Audio stream captured');
                    currentStream = stream;
                    isCapturing = true;
                    processAndTranslateAudio(stream, currentTab.id, targetLang);
                } else {
                    console.error('Unable to capture audio stream');
                }
            });
        } else {
            console.error('No active tab found');
        }
    });
}

function stopAudioCapture() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        isCapturing = false;
        console.log('Audio capture stopped');
    }
}

let token = 'ya29.c.c0ASRK0Gb8KZioZsF6TjAhaLbtwGqgmzf3vKUnD8fsvLaIaWjQHyDMtHD91H9JzegrtJtdnVbnYtEVeIi0kvUg4LUuQbUAr7kkhs4OiK9Nv0952g8S_WlHQNiqkEyRcFZTQ4erNNWk67w9RuZtpnPPgW5X1ivrVtB5zVkvyr16_iKALvCWp0XSTfuB9GLxQbqPflS7K4MHN1Th0zf5KoNLl1INrT6rink4wExl0tzTHXgU3h7rc0L7YkBs4Sm7RqhWCf4oZ8N0-fbH1cw_RkeH0_Jhh3b1QQ-jwhrkrztwdXUOEmbxHIcCBnEvvKiIpzesQ0IhUe3NC54WFzZGvFiqOn7ojAmROBQwSuog-k_rhQsC5ylc6XlZ8UcAL385DQpoYabUoUlUzx_pezzYd0g5_obJ1rJn_p7f0rtm403Qs8Io7Bhs5XdnicrfbV6RnFY3tmw-3gIam7_3z04UBsSmb8c5ijJJe6_e9Wj6f1xhW-Xjev2Onu_7Xv-wF2vWq0Qmkb4p05McZcVul0x-3UnZ-rwt4q5Qw-9xXMVvsBx6xW8VkdggeWzprvR4ujtw2WMnb-MF43_a07etant57qS3YypetmpvSiWdxtsJ8J01fpY4nd0knat_R_7rb3V-__Qytq5t690nr6ifa5Mz6w2WriJnkJQ_UYxxxo9BhffQ2r4s7BMMvMvxdvO7mZ7x5d94is_BBdcU5QY8umer-Q5Vry5Y1zgqk8WsiIVmlZ9S3bvU4a-yY25Jtchansc-Bgbz1OvsUxg-b26444R8I5Qa3t91lvX1w4O6s2_vrxS_670exIppcexifXRdUl-Ms0le5QkRqFaxmx9ws1R9hM82uk_t8-mWwz6dBO9s0usYsoW9S3oMm4bQ8wq3R5VOm1ZeY1x1gtpZJBMiZYv7hOp4JZ3j0pU7jefRdic81feX791_rRZa7598Sn8Wc74JeS-wU7grrkpZt0kuoWQvS9j-hZr94dO5160qBxsw_klZdvkBk8UX35W1nSX'
async function processAndTranslateAudio(stream, tabId) {
    try {
        // Transcribe audio stream to text (replace with real API call)
        const transcription = await transcribeAudio(stream);
        console.log('Transcription: ', transcription);

        // Translate transcribed text
        const translatedText = await textTranslation(transcription, 'es'); // Translating to Spanish
        console.log('Translated Text: ', translatedText);

        // Convert translated text to speech audio
        const translatedAudio = await textToSpeech(translatedText, 'es');
        console.log('Translated Audio Stream Ready');

        // Play the translated audio instead of original
        playTranslatedAudio(translatedAudio);
    } catch (error) {
        console.error('Error during transcription, translation or playback:', error);
    }
}


async function transcribeAudio(stream) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer${token}`);

    const raw = JSON.stringify({
        "config": {
            "languageCode": "us",
            "enableWordTimeOffsets": true,
            "enableWordConfidence": true,
            "model": "default",
            "encoding": "LINEAR16",
            "sampleRateHertz": 24000,
            "audioChannelCount": 1
        },
        "audio": {
            "content": stream
        }
    });
    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };
    try {
        const response = await fetch("https://speech.googleapis.com/v1p1beta1/speech:longrunningrecognize", requestOptions);
        const result = await response.json(); // Parse JSON
        console.log(result);
        let data = await translateByOperationId(result?.name)
        console.log(data, "data")
        return data.response;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to transcribe audio");
    }
}

async function translateByOperationId(id) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer${token}`);
    myHeaders.append("X-Goog-User-Project", "genai-research-388515");

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch(`https://speech.googleapis.com/v1/operations/${id}`, requestOptions);
        const result = await response.json(); // Parse JSON
        console.log(result);
        return result;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve translation");
    }
}
async function textTranslation(data) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer${token}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": `I 'll provide the text you need to convert that to hindi language Text:${data}`
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 1,
            "maxOutputTokens": 8192,
            "topP": 0.95
        },
        "safetySettings": [
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "OFF"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "OFF"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "OFF"
            },
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "OFF"
            }
        ]
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    try {
        const response = await fetch("https://us-central1-aiplatform.googleapis.com/v1/projects/genai-research-388515/locations/us-central1/publishers/google/models/gemini-flash-experimental:streamGenerateContent", requestOptions);
        const result = await response.json();  // Parsing response as JSON
        let combinedText = "";  // Initialize variable to store combined text

        const jsonData = result.data;

        jsonData.forEach(item => {
            item.candidates.forEach(candidate => {
                let text = candidate.content.parts[0].text;
                combinedText += text + ' ';  // Append text to combinedText
            });
        });

        console.log(combinedText);  // Log the combined text
        return combinedText
    }
    catch (error) {
        console.error('Error:', error);
    }
}
async function textToSpeech(data) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("X-Goog-User-Project", "genai-research-388515");

    const raw = JSON.stringify({
        "input": {
            "text": data
        },
        "voice": {
            "languageCode": "en-US",
            "name": "en-US-Studio-O"
        },
        "audioConfig": {
            "audioEncoding": "MP3", // Change to MP3 for easier playback
            "speakingRate": 1
        }
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    try {
        const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", requestOptions);
        const result = await response.json();
        return result.audioContent; // Return the audio content directly
    } catch (error) {
        console.error(error);
        throw new Error("Failed to synthesize text to speech");
    }
}
function playTranslatedAudio(audioContent) {
    console.log(audio)
    // Create a new audio element
    const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);

    // Play the audio
    audio.play().then(() => {
        console.log('Playing translated audio');
    }).catch((error) => {
        console.error('Error playing audio:', error);
    });
}
