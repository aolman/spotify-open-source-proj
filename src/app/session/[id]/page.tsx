'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'
import { Session } from './client'
import 'dotenv/config'
import { loadBindings } from "next/dist/build/swc";


export default function SessionPage({ params } : { params: { id: string} }) {
    // To make this a server-side component, we can receive each of the below variables as next cookies
    const [isHost, setIsHost] = useState(false);
    const [username, setUsername] = useState("");
    const [hostName, setHostName] = useState("");
    const [clientNames, setClientNames] = useState([]);
    const [queue, setQueue] = useState([]);
    const [isHostNameSet, setIsHostNameSet] = useState(false);
    const [readyCounter, setReadyCounter] = useState(0); // used to ensure useEffects have run before loading... state is lifted
    
    let sid : string = params.id;
    const router = useRouter();

    useEffect(() => {
        // Add host's name to DB now that session has been created
        if(sessionStorage.getItem('isHost') === "true") {
            fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/sessionDB/addHostName`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: sessionStorage.getItem('username'),
                    sid: sid
                })
            })
            .then((response) => {
                if(!response.ok) throw new Error(`${response.status} ${response.statusText}`)
                
                // Wait until host name has been set before setting isHost and username properties
                setIsHost(sessionStorage.getItem('isHost') == "true" ? true : false);
                setUsername(sessionStorage.getItem('username') || "");
                setIsHostNameSet(true); // Allow next useEffect access to call initSession now that host name is set
                return response.json()
            })
            .catch((error) => console.log(error))
        }
        else{
            // This functionality below should be encompassed by initSession, including the clientNames and current queue state as well
            fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/sessionDB/getHostName?session_id=${params.id}`, {
                method: "GET", 
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => {
                console.log(response);
                if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
                return response.json();
            })
            .then((data) => {
                console.log(data.hostname);
                setHostName(data.hostname);
                setUsername(sessionStorage.getItem("username") || "")
            })
            .catch((error) => {
                console.error("Error:", error);
            });

            // If user is not Host, we know the host's id must have already been set
            setIsHostNameSet(true);
        }

        console.log(readyCounter);
        setReadyCounter(readyCounter+1);

    }, []);

      useEffect(() => {
        const initSession = () => {
          fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/sessionDB/initSession`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sid }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(response.statusText);
              }
              return response.json();
            })
            .then((data) => {
              setClientNames(data.clientNames)
              setQueue(data.queue);
            })
            .catch((error) => {
              console.error("error:", error);
            });
          }

          //check if hostname is set before mounting
          if(isHostNameSet){
            initSession()
            console.log(readyCounter);
            setReadyCounter(readyCounter+1);
          }
      }, [isHostNameSet]); //if it mounts on start, this useEffect runs before the username + hostID is set in the database
    
    return (
        <main id="session-main" className="session-background flex min-h-screen flex-col items-center justify-between p-24">
            {(readyCounter != 2) ? <h1>loading...</h1>
            :
            <Session
                isHost={isHost}
                sid={sid}
                username={username}
                hostName={hostName}
                clientNames={clientNames}
                queue={queue}
                router={router}
            >      
            </Session>}
        </main>  
    )
}

