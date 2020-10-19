import { getRepository } from 'typeorm';
import { Request, Response } from 'express';
import Orphanage from '../models/Orphanage';
import orphanageView from '../views/orphanages_view';
import * as Yup from 'yup'

export default {
  async index(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanage);

    const orphanages = await orphanagesRepository.find({
      relations: ['images']
    });

    return response.json(orphanageView.renderMany(orphanages));
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;
    
    const orphanagesRepository = getRepository(Orphanage);

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images']
    });

    return response.json(orphanageView.render(orphanage));
  },
  
  async create(request: Request, response: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions, 
      opening_hours,
      open_on_weekends,
    } = request.body;
  
    const orphanagesRepository = getRepository(Orphanage);

    const requestImages = request.files as Express.Multer.File[];
    const images = requestImages.map(image => {
      return { path: image.filename }
    })
    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions, 
      opening_hours,
      open_on_weekends: open_on_weekends === 'true',
      images
    };

    const schema = Yup.object().shape({
      name: Yup.string().required('Nome obrigatório'),
      latitude: Yup.number().required('Latitude obrigatória'),
      longitude: Yup.number().required('Longitude obrigatório'),
      about: Yup.string().required('Campo \"sobre\" obrigatório').max(300),
      instructions: Yup.string().required('Campo \"instruções\" obrigatório'),
      opening_hours: Yup.string().required('Horário de funcionamento obrigatório'),
      open_on_weekends: Yup.boolean().required('Campo \"aberto nos fins de semana\" obrigatório'),
      images: Yup.array(
        Yup.object({
          path: Yup.string().required()
        })
      )
    });

    await schema.validate(data, {
      abortEarly: false,
    });
     
    const orphanage = orphanagesRepository.create(data);
  
    await orphanagesRepository.save(orphanage);
  
    return response.status(201).json(orphanage); 
  }
}