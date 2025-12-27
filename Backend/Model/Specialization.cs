namespace Homecare.Model
{
    public class Specialization {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<Physician> Physicians { get; set; }
        public Specialization()
        {
            Physicians = new List<Physician>();
        }
    }

}
