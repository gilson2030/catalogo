const firebaseConfig = {
  apiKey: "AIzaSyDPMe4QYcTEGUOGnyBPUw5bGBLDWmoTMnI",
  authDomain: "catalogo-c59c6.firebaseapp.com",
  projectId: "catalogo-c59c6",
  storageBucket: "catalogo-c59c6.appspot.com",
  messagingSenderId: "724697780828",
  appId: "1:724697780828:web:1438cad544c49c85bacc99"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
