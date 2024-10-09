document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start').addEventListener('click', () => {
      const lang = document.getElementById('lang').value;
      chrome.runtime.sendMessage({ action: 'start', lang: lang });
    });
  
    document.getElementById('stop').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'stop' });
    });
  });