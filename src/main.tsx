import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './research.css';
class Boundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}render(){return this.state.failed?<main className="fatal"><h1>Let’s get the map back.</h1><p>The view could not load. Your saved notes have not been deleted.</p><button onClick={()=>location.reload()}>Reload SignalForce</button></main>:this.props.children}}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Boundary><App/></Boundary></React.StrictMode>);
