"use client"

import Image from "next/image";
import styles from "./page.module.css";
import Drumie from 'drumie';
import { useEffect } from "react";
export default function Home() {
  let drumie
  const prefix = "ws://norsetreasure.test"
  const apiPrefix = "http://norsetreasure.test/api"
  const connectionString = `${prefix}/connect`
  var connectionToken
  const getConnectToken = (channel) => {
    return async () => {
      try {
        const res = await fetch(`${apiPrefix}/connect-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: "1",
            name: "John Doe",
            // channels: "customer"
            // channels: "customer nice"
            // channels: "*"
            channels: channel
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch token");
        }

        const data = await res.json();
        connectionToken = data.token
        return data.token;
      } catch (err) {
        console.error("Error fetching token:", err);
        throw err;
      }
    }
  }
  const getSubscribeToken = (channel) => {
    return async () => {
      try {
        const res = await fetch(`${apiPrefix}/subscribe-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: connectionToken,
            channel: channel
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch token");
        }

        const data = await res.json();
        return data.token;
      } catch (err) {
        console.error("Error fetching token:", err);
        throw err;
      }
    }
  }
  useEffect(() => {

    const channels = [
      {
        name: "customer",
        token: getSubscribeToken("customer"),
        callbacks: {
          subscribing: (ctx) => console.log("subscribing to customer", ctx),
          subscribed: (ctx) => console.log("Subscribed to customer", ctx),
          join: (ctx) => console.log("User joined customer", ctx),
          leave: (ctx) => console.log("User left customer", ctx),
          listen: (ctx) => console.log("listen in customer", ctx)
        }
      },
      {
        name: "nice",
        token: getSubscribeToken("nice"),

        callbacks: {
          subscribing: (ctx) => console.log("subscribing to nice", ctx),
          subscribed: (ctx) => console.log("Subscribed to nice", ctx),
          join: (ctx) => console.log("User joined nice", ctx),
          leave: (ctx) => console.log("User left nice", ctx),
          listen: (ctx) => console.log("listen in nice", ctx)
        }
      },
    ]


    drumie = new Drumie(connectionString, {
      connecting: (ctx) => console.log(`connecting: ${ctx.code}, ${ctx.reason}`),
      connected: (ctx) => console.log(`connected over ${ctx.transport}`),
      disconnected: (ctx) => console.log(`disconnected: ${ctx.code}, ${ctx.reason}`),
      token: getConnectToken("*"),
    }, channels);

    drumie.subscribe()
    const customerChannel = drumie.getChannel("customer")
    // drumie.removeChannel(drumie.getChannel("nice")) // leave a channel
    console.log(drumie.channels())
    let count = 0
    let interval = setInterval(() => {
      count++
      customerChannel.publish(`auto publish ${count}`)
      // customerChannel.publish({
      //     message: "auto publish from client "
      // })
    }, 2000)

    return () => {
      customerChannel.unsubscribe() // leave a channel
      drumie.disconnect()
    }
  }, [])

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        Set up ws
      </main>
    </div>
  );
}
