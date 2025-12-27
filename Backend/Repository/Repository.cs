
using Homecare.Model;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Runtime.CompilerServices;

namespace Homecare.Repository
{
    public class Repository<TEntity> : IRepository<TEntity> where TEntity : class
    {
        private readonly ApplicationDbContext context;
        private readonly DbSet<TEntity> DbSet;


        public Repository(ApplicationDbContext context)
        {
            this.context = context;
            DbSet=context.Set<TEntity>();
            
        }
        public async void DeleteById(int id)
        {
            var obj = await GetById(id);
            DbSet.Remove(obj);
        }
        public void RemoveById(int id)
        {
            var obj = DbSet.Find(id);
            if (obj != null)
            {
                DbSet.Remove(obj);
            }
        }
        public IEnumerable<TEntity> GetAll()
        {
            return DbSet.AsNoTracking();
        }
        public async Task<TEntity> GetById(int id) 
        {
            return (await DbSet.FindAsync(id));
        }
        public async Task<TEntity> FindAsync(Expression<Func<TEntity, bool>> filter, string[] includes)
        {
            Expression<Func<TEntity, bool>> ex = filter;

            var query = DbSet.AsQueryable();
            foreach (var include in includes)
            {
                query = query.Include(include).AsNoTracking();


            }
            
            return await query.FirstOrDefaultAsync(ex);
        }
        public IQueryable<TEntity> FindAll(Expression<Func<TEntity, bool>> filter, string[] includes, int take = -1, int skip = -1)
        {

            Expression<Func<TEntity, bool>> ex = filter;

            var query = DbSet.AsQueryable();
            foreach (var include in includes)
            {
                query = query.Include(include).AsNoTracking();
            }
            var res = query.Where(ex);
            if (take >= 0)
            {
                res = res.Take(take);
            }
            if (skip >= 0)
            {
                res = res.Skip(skip);
            }
            return res;
        }
        public int Count()
        {
            return DbSet.Count();
        }
        public async Task<int> CountAsync()
        {
            return await DbSet.CountAsync();
        }
        public async Task<int> CountAsync(Expression<Func<TEntity, bool>> filter)
        {
            return await DbSet.CountAsync(filter);
        }
        public void UpdateById(TEntity entity)
        {
            DbSet.Update(entity);
        }
        public async Task AddAsync(TEntity entity)
        {
            await DbSet.AddAsync(entity);
        }
        public async Task AddRangeAsync(List<TEntity> entities)
        {
            await DbSet.AddRangeAsync(entities);
        }
        public  void Delete(TEntity entity)
        {
             DbSet.Remove(entity);
        }

    }
}
