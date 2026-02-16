import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { blogService } from '@/services/blog.service';
import { formatDate } from '@/utils/date';
import { Plus, Pencil, Trash, Eye, EyeSlash, Spinner } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { BlogPost } from '@/types/blog';

export function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<any[]>([]); // Using any for BlogImage temporarily to avoid type errors if not imported yet
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await blogService.getAllPosts();
      setPosts(data.data || data);
    } catch (error) {
      toast.error('Error al cargar los artículos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenNew = () => {
    setEditingPost(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setStatus('draft');
    setSelectedImage(null);
    setPreviewImage(null);
    setGalleryImages([]);
    setExistingGallery([]);
    setRemovedImageIds([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setExcerpt(post.excerpt || '');
    setContent(post.content);
    setStatus(post.status);
    setSelectedImage(null);
    setPreviewImage(post.featured_image ? /^http/.test(post.featured_image) ? post.featured_image : `/storage/${post.featured_image}` : null);
    setGalleryImages([]);
    setExistingGallery(post.images || []);
    setRemovedImageIds([]);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setGalleryImages((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveExistingImage = (id: number) => {
    setExistingGallery((prev) => prev.filter((img) => img.id !== id));
    setRemovedImageIds((prev) => [...prev, id]);
  };

  const handleRemoveNewImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title || !content) {
      toast.error('El título y el contenido son obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPost) {
        await blogService.updatePost(editingPost.id, {
          title,
          excerpt,
          content,
          status,
          featured_image: selectedImage || undefined,
          gallery_images: galleryImages,
          remove_image_ids: removedImageIds,
        });
        toast.success('Entrada actualizada correctamente');
      } else {
        await blogService.createPost({
          title,
          content,
          excerpt,
          status,
          featured_image: selectedImage || undefined,
          gallery_images: galleryImages,
        });
        toast.success('Entrada creada correctamente');
      }
      setIsDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar la entrada');
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async (id: number) => {
    try {
      await blogService.deletePost(id);
      toast.success('Entrada eliminada correctamente');
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleTogglePublished = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      await blogService.updatePost(post.id, { status: newStatus });
      toast.success(`Entrada ${newStatus === 'published' ? 'publicada' : 'retirada'}`);
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar estado');
    }
  };

  const columns: ColumnDef<BlogPost>[] = [
    {
      header: 'Título',
      accessorKey: 'title',
      className: 'font-medium'
    },
    {
      header: 'Autor',
      cell: (post) => post.author?.name || 'Desconocido',
    },
    {
      header: 'Estado',
      cell: (post) => {
        const isPublished = post.status === 'published';
        return (
          <Badge variant={isPublished ? 'default' : 'secondary'} className={isPublished ? 'bg-green-500 hover:bg-green-600' : ''}>
            {isPublished ? 'Publicado' : 'Borrador'}
          </Badge>
        )
      }
    },
    {
      header: 'Fecha',
      cell: (post) => formatDate(post.created_at)
    },
    {
      header: 'Acciones',
      cell: (post) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTogglePublished(post)}
            title={post.status === 'published' ? 'Ocultar' : 'Publicar'}
          >
            {post.status === 'published' ? (
              <EyeSlash size={18} />
            ) : (
              <Eye size={18} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(post)}
          >
            <Pencil size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingPostId(post.id)}
          >
            <Trash size={18} className="text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los artículos de tu blog
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus size={20} />
          Nuevo Post
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Posts</CardDescription>
            <CardTitle className="text-3xl">{posts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Publicados</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {posts.filter(p => p.status === 'published').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Borradores</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {posts.filter(p => p.status === 'draft').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Posts</CardTitle>
          <CardDescription>Lista de artículos del blog</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <DataTable
              data={posts}
              columns={columns}
              emptyMessage="No hay posts para mostrar"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Editar Post' : 'Nuevo Post'}
            </DialogTitle>
            <DialogDescription>
              {editingPost ? 'Modifica el contenido del post' : 'Crea un nuevo artículo para el blog'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="5 Consejos para Comenzar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Extracto (Opcional)</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Resumen breve del artículo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image">Imagen Destacada</Label>
                <div className="flex flex-col gap-2">
                  {previewImage && (
                    <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden relative">
                      <img
                        src={previewImage}
                        alt="Previsualización"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery">Galería de Imágenes</Label>
                <Input
                  id="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryChange}
                />
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {existingGallery.map((img) => (
                    <div key={img.id} className="relative group aspect-square bg-muted rounded-md overflow-hidden">
                      <img
                        src={`/storage/${img.image_path}`}
                        alt="Galería"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveExistingImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                  {galleryImages.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-square bg-muted rounded-md overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Nuevo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido * (Markdown o HTML simple)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe el contenido aquí..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={status === 'published'}
                onCheckedChange={(checked) => setStatus(checked ? 'published' : 'draft')}
              />
              <Label htmlFor="published">Publicar inmediatamente</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
              {editingPost ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent >
      </Dialog >

      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El post será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingPostId && handleDelete(deletingPostId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

