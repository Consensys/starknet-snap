import { Meta } from '@storybook/react';
import { PopIn } from './index';
import React, { useRef, useState } from 'react';

export default {
  title: 'Molecule/PopIn',
  component: PopIn,
} as Meta;

export const Default = () => {
  let [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen}>
        <div style={{ padding: '40px' }}>
          <h3>What is a snap?</h3>
          <p>
            A snap is a program that runs in an isolated environment that can extend the functionality of MetaMask. In
            this case, StarkNet uses Snaps to add support for—and create an account on—StarkNet using MetaMask.
          </p>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      </PopIn>
    </>
  );
};

export const WithoutCloseButton = () => {
  let [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false}>
        <div style={{ padding: '40px' }}>
          <h3>What is a snap?</h3>
          <p>
            A snap is a program that runs in an isolated environment that can extend the functionality of MetaMask. In
            this case, StarkNet uses Snaps to add support for—and create an account on—StarkNet using MetaMask.
          </p>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      </PopIn>
    </>
  );
};

export const InitialFocus = () => {
  let [isOpen, setIsOpen] = useState(true);
  let textareaRef = useRef(null);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false} initialFocus={textareaRef}>
        <div style={{ padding: '40px' }}>
          <h3>What is a snap?</h3>
          <p>
            A snap is a program that runs in an isolated environment that can extend the functionality of MetaMask. In
            this case, StarkNet uses Snaps to add support for—and create an account on—StarkNet using MetaMask.
          </p>
          <button onClick={() => setIsOpen(false)}>Close</button>
          <p>
            <textarea ref={textareaRef}>I&apos;m focused!</textarea>
          </p>
        </div>
      </PopIn>
    </>
  );
};
