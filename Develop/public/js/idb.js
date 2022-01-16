const indexedDB =
window.indexedDB ||
window.mozIndexedDB ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;

let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
  };

request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
  request.onerror = function(event) {
    console.log(event.target.errorCode);
  };

function saveRecord(transaction) { 
    const transactionEl = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transactionEl.objectStore('new_transaction');
    transactionObjectStore.add(transaction);
};

function uploadTransaction() {
    const transactionEl = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transactionEl.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();


    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-type' : "application/json"
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transactionEl = db.transaction([ 'new_transaction' ], 'readwrite');
                const transactionObjectStore = transactionEl.objectStore('new_transaction');
                transactionObjectStore.clear();
            })
            .catch(err => {
                console.log(err);
            })
        }
        }
};

window.addEventListener('online', uploadTransaction);