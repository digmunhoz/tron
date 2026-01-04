"""change_user_role_to_string

Revision ID: change_user_role_to_string
Revises: add_users_table
Create Date: 2026-01-03 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'change_user_role_to_string'
down_revision: Union[str, None] = 'add_users_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Alterar coluna role de enum para string
    # Primeiro, converter os valores existentes (se houver)
    op.execute(sa.text("""
        ALTER TABLE users
        ALTER COLUMN role TYPE VARCHAR USING role::text
    """))

    # Remover o tipo enum se não estiver sendo usado em outras tabelas
    # (Verificar se há outras tabelas usando userrole antes de dropar)
    op.execute(sa.text("DROP TYPE IF EXISTS userrole"))


def downgrade() -> None:
    # Recriar o enum
    op.execute(sa.text("DO $$ BEGIN CREATE TYPE userrole AS ENUM ('admin', 'user', 'viewer'); EXCEPTION WHEN duplicate_object THEN null; END $$;"))

    # Alterar coluna role de string para enum
    op.execute(sa.text("""
        ALTER TABLE users
        ALTER COLUMN role TYPE userrole USING role::userrole
    """))

