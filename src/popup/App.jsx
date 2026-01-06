import React from "react";

export default function App() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🦅 FocusFalcon</h1>
      <p style={styles.text}>
        Block distractions. Build focus.
      </p>
    </div>
  );
}

const styles = {
  container: {
    width: 300,
    padding: 16,
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    margin: 0,
    fontSize: 20,
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.8,
  },
};
