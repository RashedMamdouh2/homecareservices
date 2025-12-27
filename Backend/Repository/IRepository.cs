using System.Linq.Expressions;

namespace Homecare.Repository
{
    public interface IRepository<TEntity> where TEntity : class
    {
        public Task<TEntity> GetById(int id);
        public void DeleteById(int id);
        public void UpdateById(TEntity entity);
        public IEnumerable<TEntity> GetAll();
        public int Count();
        public IEnumerable<TEntity> FindAll(Expression<Func<TEntity, bool>> filter, string[] includes, int take = -1, int skip = -1);
        public  Task<TEntity> FindAsync(Expression<Func<TEntity, bool>> filter, string[] includes);
        public Task AddAsync(TEntity entity);
        public  Task AddRangeAsync(List<TEntity> entities);
        public void Delete(TEntity entity);
    }
}
