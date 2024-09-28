"""empty message

Revision ID: 83bd1fcd1e01
Revises: 808502f3061c
Create Date: 2024-09-28 17:36:55.132610

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83bd1fcd1e01'
down_revision: Union[str, None] = '808502f3061c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('webapp_deploys', sa.Column('healthcheck', sa.JSON(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('webapp_deploys', 'healthcheck')
    # ### end Alembic commands ###
