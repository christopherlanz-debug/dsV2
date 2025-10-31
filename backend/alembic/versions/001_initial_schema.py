"""Initial schema with all tables."""
from alembic import op
import sqlalchemy as sa


revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255)),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='viewer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )

    # screens
    op.create_table(
        'screens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_online', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('last_seen', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('assigned_playlist_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # content
    op.create_table(
        'content',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('content_type', sa.String(50), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('thumbnail_path', sa.String(500), nullable=True),
        sa.Column('pdf_page_count', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # content_items
    op.create_table(
        'content_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('item_number', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['content_id'], ['content.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # playlists
    op.create_table(
        'playlists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('loop', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('shuffle', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # playlist_items
    op.create_table(
        'playlist_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('playlist_id', sa.Integer(), nullable=False),
        sa.Column('content_item_id', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('duration_override', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['playlist_id'], ['playlists.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['content_item_id'], ['content_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # playlist_schedules
    op.create_table(
        'playlist_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('playlist_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('monday', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('tuesday', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('wednesday', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('thursday', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('friday', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('saturday', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('sunday', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['playlist_id'], ['playlists.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('playlist_schedules')
    op.drop_table('playlist_items')
    op.drop_table('playlists')
    op.drop_table('content_items')
    op.drop_table('content')
    op.drop_table('screens')
    op.drop_table('users')
