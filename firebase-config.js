<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyC-hxR_Vzh5cL94WoSqo4CjOUY7I3Hb3KI",
    authDomain: "fir-service-ec414.firebaseapp.com",
    projectId: "fir-service-ec414",
    storageBucket: "fir-service-ec414.firebasestorage.app",
    messagingSenderId: "451378063416",
    appId: "1:451378063416:web:8500a2983189e172af9ecd",
    measurementId: "G-8MNYQYJ9LP"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
