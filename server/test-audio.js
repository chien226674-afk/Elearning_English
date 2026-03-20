import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function test() {
  const form = new FormData();
  form.append('audio', Buffer.from('test audio'), 'speech.webm');
  form.append('lessonItemId', '1');
  form.append('type', 'vocab');
  
  try {
    const response = await fetch('http://localhost:5000/api/lessons/evaluate-speaking-audio', {
      method: "POST",
      body: form // fetch accepts FormData directly in newer Node, but let's use axios since form-data is installed
    });
  } catch(e) {}
}

async function testAxios() {
    const form = new FormData();
    form.append('audio', Buffer.from('test audio'), 'speech.webm');
    form.append('lessonItemId', '8'); // assuming 8 is a valid vocab ID
    form.append('type', 'vocab');
    
    try {
      // Need a valid token
      const token = process.argv[2];
      if (!token) { console.log('Please provide a token'); return; }

      const res = await axios.post('http://localhost:5000/api/lessons/evaluate-speaking-audio', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
      });
      console.log(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
}
testAxios();
