"""add community chat persistence

Revision ID: 3f9c2a71b8d4
Revises: 07d150f8e551
Create Date: 2026-10-23 10:12:44.032117

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f9c2a71b8d4'
down_revision: Union[str, Sequence[str], None] = '07d150f8e551'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('chat_files',
    sa.Column('file_id', sa.String(length=120), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('size', sa.Integer(), nullable=False),
    sa.Column('content_type', sa.String(length=100), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('file_id')
    )
    op.create_index(op.f('ix_chat_files_expires_at'), 'chat_files', ['expires_at'], unique=False)
    op.create_table('chat_messages',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('sender_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('content_type', sa.String(length=20), nullable=False),
    sa.Column('file_id', sa.String(length=120), nullable=True),
    sa.Column('file_name', sa.String(length=255), nullable=True),
    sa.Column('file_size', sa.Integer(), nullable=True),
    sa.Column('file_content_type', sa.String(length=100), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.ForeignKeyConstraint(['file_id'], ['chat_files.file_id'], ),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_created_at'), 'chat_messages', ['created_at'], unique=False)
    op.create_index(op.f('ix_chat_messages_sender_id'), 'chat_messages', ['sender_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_chat_messages_sender_id'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_created_at'), table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_index(op.f('ix_chat_files_expires_at'), table_name='chat_files')
    op.drop_table('chat_files')
