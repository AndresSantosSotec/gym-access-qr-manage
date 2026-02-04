import { useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { blogService } from '@/services/blog.service';
import { formatDate } from '@/utils/date';
import { Plus, Pencil, Trash, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { BlogPost } from '@/types/models';

export function BlogAdmin() {
  const [posts, setPosts] = useState(blogService.getAllPosts());
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    published: true,
  });

  const handleOpenNew = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImageUrl: '',
      published: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl || '',
      published: post.published,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.slug || !formData.excerpt || !formData.content) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const postData = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      coverImageUrl: formData.coverImageUrl || undefined,
      published: formData.published,
    };

    if (editingPost) {
      blogService.updatePost(editingPost.id, postData);
      toast.success('Post actualizado correctamente');
    } else {
      blogService.createPost(postData);
      toast.success('Post creado correctamente');
    }

    setPosts(blogService.getAllPosts());
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    blogService.deletePost(id);
    setPosts(blogService.getAllPosts());
    setDeletingPostId(null);
    toast.success('Post eliminado correctamente');
  };

  const handleTogglePublished = (id: string) => {
    blogService.togglePublished(id);
    setPosts(blogService.getAllPosts());
    toast.success('Estado de publicación actualizado');
  };

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
              {posts.filter(p => p.published).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Borradores</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {posts.filter(p => !p.published).length}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay posts para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{post.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(post.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublished(post.id)}
                          title={post.published ? 'Ocultar' : 'Publicar'}
                        >
                          {post.published ? (
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="5 Consejos para Comenzar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug * (para URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="5-consejos-para-comenzar"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Extracto *</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Resumen breve del artículo"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">URL Imagen de Portada (opcional)</Label>
              <Input
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido * (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="## Título&#10;&#10;Contenido del post en Markdown..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">Publicar en web pública</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingPost ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={() => deletingPostId && handleDelete(deletingPostId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
