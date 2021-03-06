// Copyright (c) 2018 ml5
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/*
Word2Vec
*/

import { div, tensor, add, sub, util } from 'deeplearn';

class Word2Vec {
  constructor(vectors, callback) {
    this.ready = false;
    this.model = {};
    this.modelSize = 0;
    this.loadVectors(vectors, callback);
  }

  loadVectors(file, callback) {
    fetch(file)
      .then(response => response.json())
      .then((json) => {
        Object.keys(json.vectors).forEach((word) => {
          this.model[word] = tensor(json.vectors[word]);
        });
        this.modelSize = Object.keys(json).length;
        this.ready = true;
        if (callback) {
          callback();
        }
      }).catch((error) => {
        console.log(`There has been a problem loading the vocab: ${error.message}`);
      });
  }

  add(inputs, max = 1) {
    const sum = Word2Vec.addOrSubtract(this.model, inputs, 'ADD');
    return Word2Vec.nearest(this.model, sum, inputs.length, inputs.length + max);
  }

  subtract(inputs, max = 1) {
    const subtraction = Word2Vec.addOrSubtract(this.model, inputs, 'SUBTRACT');
    return Word2Vec.nearest(this.model, subtraction, inputs.length, inputs.length + max);
  }

  average(inputs, max = 1) {
    const sum = Word2Vec.addOrSubtract(this.model, inputs, 'ADD');
    const avg = div(sum, tensor(inputs.length));
    return Word2Vec.nearest(this.model, avg, inputs.length, inputs.length + max);
  }

  nearest(input, max = 10) {
    const vector = this.model[input];
    if (!vector) {
      return null;
    }
    return Word2Vec.nearest(this.model, vector, 1, max + 1);
  }

  getRandomWord() {
    const words = Object.keys(this.model);
    return words[Math.floor(Math.random() * words.length)];
  }

  static addOrSubtract(model, values, operation) {
    const vectors = [];
    const notFound = [];
    if (values.length < 2) {
      throw new Error('Invalid input, must be passed more than 1 value');
    }
    values.forEach((value) => {
      const vector = model[value];
      if (!vector) {
        notFound.push(value);
      } else {
        vectors.push(vector);
      }
    });

    if (notFound.length > 0) {
      throw new Error(`Invalid input, vector not found for: ${notFound.toString()}`);
    }
    let result = vectors[0];
    if (operation === 'ADD') {
      for (let i = 1; i < vectors.length; i += 1) {
        result = add(result, vectors[i]);
      }
    } else {
      for (let i = 1; i < vectors.length; i += 1) {
        result = sub(result, vectors[i]);
      }
    }
    return result;
  }

  static nearest(model, input, start, max) {
    const nearestVectors = [];
    Object.keys(model).forEach((vector) => {
      const distance = util.distSquared(input.dataSync(), model[vector].dataSync());
      nearestVectors.push({ vector, distance });
    });
    nearestVectors.sort((a, b) => a.distance - b.distance);
    return nearestVectors.slice(start, max);
  }
}

export default Word2Vec;
