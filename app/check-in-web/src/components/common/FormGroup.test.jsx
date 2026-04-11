import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormGroup from './FormGroup';

describe('FormGroup Component', () => {
  it('renders input with label', () => {
    const { getByLabelText } = render(
      <FormGroup label="Test Label" name="test" onChange={() => {}} />
    );
    expect(getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('handles text input changes', () => {
    const handleChange = vi.fn();
    const { getByLabelText } = render(
      <FormGroup label="Name" name="name" value="" onChange={handleChange} />
    );
    const input = getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'John' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders textarea when type is textarea', () => {
    const { getByLabelText } = render(
      <FormGroup label="Bio" name="bio" type="textarea" onChange={() => {}} />
    );
    const textarea = getByLabelText('Bio');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders select with options', () => {
    const options = [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }];
    const { getByLabelText, getByText } = render(
      <FormGroup label="Choice" name="choice" type="select" options={options} onChange={() => {}} />
    );
    expect(getByText('One')).toBeInTheDocument();
    expect(getByText('Two')).toBeInTheDocument();
  });

  it('renders checkbox', () => {
    const { getByLabelText } = render(
      <FormGroup label="Agree" name="agree" type="checkbox" checked={false} onChange={() => {}} />
    );
    const checkbox = getByLabelText(/Agree/);
    expect(checkbox.type).toBe('checkbox');
  });

  it('displays error message', () => {
    const { getByText } = render(
      <FormGroup label="Name" name="name" error="Required field" onChange={() => {}} />
    );
    expect(getByText('Required field')).toBeInTheDocument();
  });
});
