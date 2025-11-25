import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [training, setTraining] = useState(false);
  const [model, setModel] = useState(null);
  const [message, setMessage] = useState('');

  async function loadProducts() {
    setMessage('Loading products...');
    setLoadingProducts(true);
    try {
      const res = await fetch('http://localhost:8082/api/products');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const mapped = data.map(p => ({
        id: p.id,
        name: p.name ?? p.product_name ?? `Product ${p.id}`,
        inventory: Number(p.inventory ?? p.inventory_level ?? 0),
        avgSales: Number(p.avg_sales ?? p.average_sales ?? 1),
        leadTime: Number(p.lead_time ?? p.days_to_replenish ?? 1)
      }));
      setProducts(mapped);
      setMessage(`Loaded ${mapped.length} products.`);
    } catch (err) {
      console.warn(err);
      setProducts(makeMockData(50));
      setMessage('API failed — using mock data.');
    } finally {
      setLoadingProducts(false);
    }
  }

  async function trainModel() {
    if (products.length === 0) {
      setMessage('No products to train on. Load products first.');
      return;
    }
    setTraining(true);
    setMessage('Preparing data...');

    const xs = [];
    const ys = [];
    products.forEach(p => {
      xs.push([p.inventory, p.avgSales, p.leadTime]);
      ys.push([p.inventory < p.avgSales * p.leadTime ? 1 : 0]);
    });

    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys);

    const m = tf.sequential();
    m.add(tf.layers.dense({ inputShape: [3], units: 12, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    m.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

    setMessage('Training model — please wait...');
    try {
      await m.fit(xsTensor, ysTensor, { epochs: 60, shuffle: true, verbose: 0 });
      setModel(m);
      setMessage('Model trained!');
    } catch (e) {
      console.error(e);
      setMessage('Training failed: ' + e.message);
    } finally {
      tf.dispose(xsTensor);
      tf.dispose(ysTensor);
      setTraining(false);
    }
  }

  function predictProb(p) {
    if (!model) return null;
    try {
      const input = tf.tensor2d([[p.inventory, p.avgSales, p.leadTime]]);
      const out = model.predict(input);
      const prob = out.dataSync()[0];
      input.dispose(); out.dispose();
      return prob;
    } catch (e) {
      console.error('Predict error', e);
      return null;
    }
  }

  return (
    <div className="container">
      <h1 className="mb-3">Forecast App</h1>
      <p>
        Loads products from Laravel API and trains a small TensorFlow.js model in the browser.
      </p>

      <div className="mb-3">
        <button className="btn btn-primary me-2" onClick={loadProducts} disabled={loadingProducts}>
          {loadingProducts ? 'Loading...' : 'Load Products'}
        </button>
        <button className="btn btn-success" onClick={trainModel} disabled={training || products.length === 0}>
          {training ? 'Training...' : 'Train Model'}
        </button>
      </div>

      <div className="mb-3 text-muted">{message}</div>

      <div className="row">
        {products.length === 0 ? (
          <div className="col-12"><div className="alert alert-info">No products yet — click "Load Products".</div></div>
        ) : (
          products.map(p => {
            const prob = predictProb(p);
            const label = prob == null ? 'Train model' : (prob > 0.5 ? `Reorder (${(prob*100).toFixed(0)}%)` : `No Reorder (${(prob*100).toFixed(0)}%)`);
            return (
              <div className="col-sm-6 col-md-4" key={p.id}>
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text mb-1">Inventory: {p.inventory}</p>
                    <p className="card-text mb-1">Avg/week: {p.avgSales}</p>
                    <p className="card-text mb-2">Lead time: {p.leadTime} days</p>
                    <div><strong>Prediction:</strong> {label}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function makeMockData(n=30) {
  const arr = [];
  for (let i=1;i<=n;i++){
    const avgSales = Math.max(1, Math.round(Math.random()*30));
    const leadTime = Math.max(1, Math.round(Math.random()*14));
    const inventory = Math.round((avgSales * leadTime)*(0.1 + Math.random()*2));
    arr.push({ id: i, name: 'Product ' + i, inventory, avgSales, leadTime });
  }
  return arr;
}
