// Testes de Integração — greenhouseService
//
// Verifica que as funções do serviço de estufas chamam os endpoints corretos.
// O Axios é completamente mockado — não faz chamadas HTTP reais.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../api/client.js';
import {
  listGreenhouses,
  getGreenhouse,
  createGreenhouse,
  deleteGreenhouse,
} from '../../api/greenhouseService.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('greenhouseService — listar estufas', () => {

  it('GET /estufas/ retorna objeto com lista greenhouses', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    const resultado = await listGreenhouses();

    expect(api.get).toHaveBeenCalledWith('/estufas/');
    expect(resultado).toHaveProperty('greenhouses');
    expect(Array.isArray(resultado.greenhouses)).toBe(true);
  });

  it('repassa o erro da API ao chamador quando a listagem falha', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(listGreenhouses()).rejects.toBeTruthy();
  });

});

describe('greenhouseService — buscar estufa por ID', () => {

  it('GET /estufas/:id retorna objeto com greenhouse', async () => {
    api.get.mockResolvedValueOnce({ data: { id: 'estufa-001', nome: 'Principal' } });

    const resultado = await getGreenhouse('estufa-001');

    expect(api.get).toHaveBeenCalledWith('/estufas/estufa-001');
    expect(resultado).toHaveProperty('greenhouse');
  });

});

describe('greenhouseService — criar estufa', () => {

  it('POST /estufas/ converte campos em português antes de enviar', async () => {
    api.post.mockResolvedValueOnce({ data: { id: 'e-nova', nome: 'Nova Estufa' } });

    await createGreenhouse({ name: 'Nova Estufa', state: 'PR', city: 'Curitiba', cep: '80000-000' });

    // O serviço converte name→nome, state→estado, city→cidade antes de chamar a API
    expect(api.post).toHaveBeenCalledWith('/estufas/', expect.objectContaining({
      nome: 'Nova Estufa',
      estado: 'PR',
      cidade: 'Curitiba',
    }));
  });

});

describe('greenhouseService — deletar estufa', () => {

  it('DELETE /estufas/:id é chamado com o ID correto', async () => {
    api.delete.mockResolvedValueOnce({ data: { message: 'Removida.' } });

    await deleteGreenhouse('estufa-001');

    expect(api.delete).toHaveBeenCalledWith(expect.stringContaining('estufa-001'));
  });

});
