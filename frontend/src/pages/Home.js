import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const tools = [
  { name: 'JSON Formatter', path: '/json-formatter' }
];

const Home = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Welcome to TechToolStack</h1>
    <ul className="space-y-2">
      {tools.map((tool, index) => (
        <li key={index}>
          <Link to={tool.path} className="text-blue-600 underline">
            {tool.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Home;
