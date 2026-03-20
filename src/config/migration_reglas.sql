-- Migration to add filtering rules for users
CREATE TABLE IF NOT EXISTS reglas_filtrado (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
  campo VARCHAR(50) NOT NULL, -- e.g., 'n_serie', 'establecimiento', 'direccion'
  valor VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
