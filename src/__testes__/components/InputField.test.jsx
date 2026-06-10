// Testes — Componente InputField
// Verifica renderização, props e acessibilidade do campo de formulário.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputField } from '../../components/InputField.jsx';

describe('InputField', () => {

  it('renderiza o label corretamente', () => {
    render(<InputField label="E-mail" name="email" value="" onChange={() => {}} />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });

  it('renderiza o input com type correto', () => {
    render(<InputField label="Senha" name="password" type="password" value="" onChange={() => {}} />);
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('usa type="text" como padrão quando type não é informado', () => {
    render(<InputField label="Nome" name="nome" value="" onChange={() => {}} />);
    expect(document.querySelector('input[type="text"]')).toBeInTheDocument();
  });

  it('chama onChange quando o usuário digita', () => {
    const handleChange = vi.fn();
    render(<InputField label="Nome" name="nome" value="" onChange={handleChange} />);
    const input = document.querySelector('input');
    fireEvent.change(input, { target: { value: 'João' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('passa props extras para o input (autoComplete, required, etc.)', () => {
    render(
      <InputField
        label="E-mail"
        name="email"
        value=""
        onChange={() => {}}
        autoComplete="email"
        required
        data-testid="input-email"
      />
    );
    const input = screen.getByTestId('input-email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toBeRequired();
  });

  it('exibe o valor controlado passado como prop', () => {
    render(<InputField label="CEP" name="cep" value="80000-000" onChange={() => {}} />);
    const input = document.querySelector('input');
    expect(input.value).toBe('80000-000');
  });

});
