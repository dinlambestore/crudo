-- Tabla de productos
create table products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price integer not null,
  sizes text not null default 'S,M,L,XL',
  colors text not null default '#181510',
  tag text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Permite que la tienda (visitantes) lea solo los productos activos
alter table products enable row level security;

create policy "Lectura pública de productos activos"
on products for select
using (active = true);

-- Productos de ejemplo (los podés editar/borrar desde Table Editor)
insert into products (name, category, price, sizes, colors, tag) values
  ('Remera Oversize Crudo', 'remeras', 52000, 'S,M,L,XL', '#181510,#ECE7DA,#8F3315', 'Nuevo'),
  ('Buzo Canguro Frisa', 'buzos', 78000, 'S,M,L,XL', '#181510,#5B5548,#8F3315', 'Más vendido'),
  ('Campera Bomber', 'camperas', 118000, 'M,L,XL', '#181510,#465A3E', 'Nuevo'),
  ('Pantalón Cargo', 'pantalones', 72000, 'S,M,L,XL', '#5B5548,#181510', null);
