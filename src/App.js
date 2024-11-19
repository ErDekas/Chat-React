import React, { useRef, useState, useEffect } from 'react';
import firebase from 'firebase/compat/app'; 
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyCJ89umRVlkMWo9DfUIjiF0N3eb81pBMy0",
  authDomain: "react-chat-9732c.firebaseapp.com",
  projectId: "react-chat-9732c",
  storageBucket: "react-chat-9732c.firebasestorage.app",
  messagingSenderId: "1069628989950",
  appId: "1:1069628989950:web:a71b5e9c967344ddb4a0af",
  measurementId: "G-1F0G7JNWQJ"
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>⚛️🔥💬</h1>
        <SignOut />
      </header>
      
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p className='rules'>Do not violate the community guidelines or you will be banned for life!</p>
    </>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(10000);
  const [messages] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState('');

  // Función para borrar todo el chat
  const clearChat = async () => {
    const batch = firestore.batch();
    const snapshot = await messagesRef.get();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("All messages have been deleted.");
  };

  // Ejecutar el borrado cada 24 horas (86,400,000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      clearChat(); // Borra los mensajes cada 24 horas
    }, 86400000); // 86,400,000 ms = 24 horas

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!formValue.trim()) {
      // No permitir mensajes vacíos
      return;
    }

    if (formValue.length > 1000) {
      // Limitar el tamaño del mensaje a 1000 caracteres
      alert("El mensaje no puede tener más de 1000 caracteres.");
      return;
    }

    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <div ref={dummy}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input 
          value={formValue} 
          onChange={(e) => setFormValue(e.target.value)} 
          placeholder="Say something nice" 
          maxLength="1000"  // Limita la longitud del texto directamente en el input
        />
        <button type="submit">▶</button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`} key={props.id}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="" />
      <p>{text}</p>
    </div>
  );
}

export default App;
